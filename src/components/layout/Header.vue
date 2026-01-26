<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import cloneDeep from 'lodash/cloneDeep';
import { v4 as uuidv4 } from 'uuid';
import { useDesignerStore } from '@/stores/designer';
import { Printer, FileOutput, ZoomIn, ZoomOut, Settings, Save } from 'lucide-vue-next';
import { PAPER_SIZES, type PaperSizeKey } from '@/constants/paper';

const store = useDesignerStore();

const selectedPaper = ref<PaperSizeKey>('A4');
const customWidth = ref(PAPER_SIZES.A4.width);
const customHeight = ref(PAPER_SIZES.A4.height);
const showPaperSettings = ref(false);
const showZoomSettings = ref(false);
const zoomPercent = ref(Math.round(store.zoom * 100));

const handlePaperChange = () => {
  if (selectedPaper.value !== 'CUSTOM') {
    const size = PAPER_SIZES[selectedPaper.value];
    customWidth.value = size.width;
    customHeight.value = size.height;
    store.setCanvasSize(size.width, size.height);
  }
};

const applyCustomSize = () => {
  store.setCanvasSize(customWidth.value, customHeight.value);
  if (!Object.values(PAPER_SIZES).some(s => s.width === customWidth.value && s.height === customHeight.value)) {
    selectedPaper.value = 'CUSTOM';
  }
};

// Sync local state with store
watch(() => store.canvasSize, (newSize) => {
  customWidth.value = newSize.width;
  customHeight.value = newSize.height;
  
  // Find matching paper size
  const match = Object.entries(PAPER_SIZES).find(([_, size]) => 
    size.width === newSize.width && size.height === newSize.height
  );
  
  if (match) {
    selectedPaper.value = match[0] as PaperSizeKey;
  } else {
    selectedPaper.value = 'CUSTOM';
  }
}, { immediate: true });

const handleZoomIn = () => {
  store.setZoom(Math.min(store.zoom + 0.1, 3));
  zoomPercent.value = Math.round(store.zoom * 100);
  showZoomSettings.value = true;
};

const handleZoomOut = () => {
  store.setZoom(Math.max(store.zoom - 0.1, 0.5));
  zoomPercent.value = Math.round(store.zoom * 100);
  showZoomSettings.value = true;
};

watch(() => store.zoom, (z) => {
  zoomPercent.value = Math.round(z * 100);
});

const handleZoomSlider = () => {
  const clamped = Math.max(50, Math.min(300, zoomPercent.value));
  zoomPercent.value = clamped;
  store.setZoom(clamped / 100);
};

const createRepeatedPages = () => {
  const original = cloneDeep(store.pages);
  const findLineY = (type: 'header' | 'footer') => {
    for (const p of original) {
      const el = p.elements.find(e => 
        (type === 'header' && e.type === 'header') ||
        (type === 'footer' && e.type === 'footer')
      );
      if (el) return el.y;
    }
    return null;
  };
  const headerY = findLineY('header');
  const footerY = findLineY('footer');
  if (headerY === null && footerY === null) return original;

  const basePage = original[0];
  const repeatHeaders = headerY !== null ? basePage.elements.filter(e => e.type !== 'header' && e.type !== 'footer' && e.type !== 'pageNumber' && (e.y + e.height) <= headerY) : [];
  const repeatFooters = footerY !== null ? basePage.elements.filter(e => e.type !== 'header' && e.type !== 'footer' && e.type !== 'pageNumber' && e.y >= footerY) : [];

  const withRepeats = cloneDeep(original);
  for (let i = 0; i < withRepeats.length; i++) {
    if (i === 0) continue;
    const page = withRepeats[i];
    for (const el of repeatHeaders) {
      page.elements.push({ ...cloneDeep(el), id: uuidv4() });
    }
    for (const el of repeatFooters) {
      page.elements.push({ ...cloneDeep(el), id: uuidv4() });
    }
  }
  return withRepeats;
};

const handlePrint = async () => {
  const previousSelection = store.selectedElementId;
  const previousShowGrid = store.showGrid;
  const previousZoom = store.zoom;
  const previousPages = cloneDeep(store.pages);

  store.selectElement(null);
  store.setShowGrid(false);
  store.setZoom(1);
  document.body.classList.add('exporting');
  store.pages = createRepeatedPages();
  await nextTick();

  const pages = document.querySelectorAll('.print-page');
  if (!pages.length) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    document.body.classList.remove('exporting');
    store.setShowGrid(previousShowGrid);
    store.selectElement(previousSelection);
    store.setZoom(previousZoom);
    store.pages = previousPages;
    return;
  }

  const style = `
    <style>
      @page { size: ${store.canvasSize.width}px ${store.canvasSize.height}px; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .print-page { width: ${store.canvasSize.width}px; height: ${store.canvasSize.height}px; box-shadow: none !important; page-break-after: always; }
      .print-page:last-child { page-break-after: auto; }
      .marker { display: none !important; }
    </style>
  `;

  const bodyHtml = Array.from(pages).map(p => (p as HTMLElement).outerHTML).join('');
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head>${style}</head><body>${bodyHtml}</body></html>`);
  printWindow.document.close();
  printWindow.focus();

  const restore = () => {
    document.body.classList.remove('exporting');
    store.setShowGrid(previousShowGrid);
    store.selectElement(previousSelection);
    store.setZoom(previousZoom);
    store.pages = previousPages;
  };

  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
      restore();
    };
  };
};

const handleExport = async () => {
  const previousSelection = store.selectedElementId;
  const previousShowGrid = store.showGrid;
  const previousPages = cloneDeep(store.pages);

  store.selectElement(null);
  store.setShowGrid(false);
  document.body.classList.add('exporting');
  store.pages = createRepeatedPages();
  await nextTick();

  try {
    const pages = document.querySelectorAll('.print-page');
    if (!pages.length) return;

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [store.canvasSize.width, store.canvasSize.height],
      hotfixes: ['px_scaling']
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      const canvas = await html2canvas(page, {
        scale: 1,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage([store.canvasSize.width, store.canvasSize.height]);
      }

      pdf.addImage(imgData, 'PNG', 0, 0, store.canvasSize.width, store.canvasSize.height);
    }

    pdf.save('print-design.pdf');
  } catch (error) {
    console.error('Export failed', error);
    alert('Export failed');
  } finally {
    document.body.classList.remove('exporting');
    store.setShowGrid(previousShowGrid);
    store.selectElement(previousSelection);
    store.pages = previousPages;
  }
};

const handleSave = () => {
  const data = {
    pages: store.pages,
    canvasSize: store.canvasSize,
    guides: store.guides,
    zoom: store.zoom,
    showGrid: store.showGrid
  };

  try {
    localStorage.setItem('localdata', JSON.stringify(data));
    alert('Save successful');
  } catch (error) {
    console.error('Save failed', error);
    alert('Save failed');
  }
};
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 relative shadow-sm">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">P</div>
      <h1 class="font-semibold text-gray-700">Print Designer</h1>
    </div>

    <div class="flex items-center gap-4">
      <!-- Paper Settings -->
      <div class="relative">
        <button 
          @click="showPaperSettings = !showPaperSettings"
          class="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          <Settings class="w-4 h-4" />
          <span>{{ selectedPaper === 'CUSTOM' ? 'Custom' : selectedPaper }}</span>
        </button>

        <div v-if="showPaperSettings" class="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Paper Settings</h3>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Size Preset</label>
              <select 
                v-model="selectedPaper" 
                @change="handlePaperChange"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
              >
                <option v-for="(size, key) in PAPER_SIZES" :key="key" :value="key">
                  {{ key }} ({{ size.width }}x{{ size.height }})
                </option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Width (PX)</label>
                <input 
                  type="number" 
                  v-model.number="customWidth"
                  @change="applyCustomSize"
                  class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Height (PX)</label>
                <input 
                  type="number" 
                  v-model.number="customHeight"
                  @change="applyCustomSize"
                  class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          
          <div class="mt-4 flex items-center justify-between">
            <span class="text-sm text-gray-700 font-medium">Show Corner Markers</span>
            <button 
              @click="store.setShowCornerMarkers(!store.showCornerMarkers)"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              :class="store.showCornerMarkers ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <span class="sr-only">Toggle corner markers</span>
              <span
                aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="store.showCornerMarkers ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-gray-700 font-medium">Show Grid</span>
            <button 
              @click="store.setShowGrid(!store.showGrid)"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              :class="store.showGrid ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <span class="sr-only">Toggle grid</span>
              <span
                aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="store.showGrid ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
          
          <div 
            class="fixed inset-0 z-[-1]" 
            @click="showPaperSettings = false"
          ></div>
        </div>
      </div>

      <div class="h-6 w-px bg-gray-300"></div>

      <!-- Zoom Settings -->
      <div class="relative">
        <div class="flex items-center bg-gray-100 rounded-lg p-1">
          <button @click="handleZoomOut" class="p-1 hover:bg-gray-200 rounded" title="Zoom Out">
            <ZoomOut class="w-4 h-4" />
          </button>
          <button 
            @click="showZoomSettings = !showZoomSettings" 
            class="text-xs w-12 text-center hover:bg-gray-200 rounded px-1 py-0.5"
            title="Zoom Settings"
          >
            {{ Math.round(store.zoom * 100) }}%
          </button>
          <button @click="handleZoomIn" class="p-1 hover:bg-gray-200 rounded" title="Zoom In">
            <ZoomIn class="w-4 h-4" />
          </button>
        </div>

        <div v-if="showZoomSettings" class="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Zoom</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Zoom Level (50% - 300%)</label>
              <input 
                type="range" 
                min="50" 
                max="300" 
                step="1" 
                v-model.number="zoomPercent" 
                @input="handleZoomSlider"
                class="w-full"
              />
              <div class="text-right text-xs text-gray-600 mt-1">{{ zoomPercent }}%</div>
            </div>
          </div>

          <div class="fixed inset-0 z-[-1]" @click="showZoomSettings = false"></div>
        </div>
      </div>
      
      <div class="h-6 w-px bg-gray-300"></div>

      <button @click="handlePrint" class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
        <Printer class="w-4 h-4" />
        <span>Print</span>
      </button>

      <button @click="handleExport" class="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
        <FileOutput class="w-4 h-4" />
        <span>Export PDF</span>
      </button>

      <button @click="handleSave" class="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
        <Save class="w-4 h-4" />
        <span>Save</span>
      </button>
    </div>
  </header>
</template>
