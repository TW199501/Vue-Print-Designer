<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDesignerStore } from '@/stores/designer';
import Type from '~icons/material-symbols/text-fields';
import Image from '~icons/material-symbols/image';
import Table from '~icons/material-symbols/table-chart';
import Barcode from '~icons/material-symbols/barcode';
import QrCode from '~icons/material-symbols/qr-code';
import HorizontalRule from '~icons/material-symbols/horizontal-rule';
import CheckBoxOutlineBlank from '~icons/material-symbols/check-box-outline-blank';
import RadioButtonUnchecked from '~icons/material-symbols/radio-button-unchecked';
import Star from '~icons/material-symbols/star';
import Delete from '~icons/material-symbols/delete';
import { ElementType, type CustomElementTemplate } from '@/types';

const store = useDesignerStore();
const activeTab = ref<'standard' | 'custom'>('standard');
const customElements = computed(() => store.customElements);

const categories = [
  {
    title: 'General',
    items: [
      { type: ElementType.TEXT, label: 'Text', icon: Type },
      { type: ElementType.IMAGE, label: 'Image', icon: Image },
      { type: ElementType.PAGE_NUMBER, label: 'Pager', icon: Type },
    ]
  },
  {
    title: 'Data & Codes',
    items: [
      { type: ElementType.TABLE, label: 'Table', icon: Table },
      { type: ElementType.BARCODE, label: 'Barcode', icon: Barcode },
      { type: ElementType.QRCODE, label: 'QR Code', icon: QrCode },
    ]
  },
  {
    title: 'Shapes',
    items: [
      { type: ElementType.LINE, label: 'Line', icon: HorizontalRule },
      { type: ElementType.RECT, label: 'Rect', icon: CheckBoxOutlineBlank },
      { type: ElementType.CIRCLE, label: 'Circle', icon: RadioButtonUnchecked },
    ]
  }
];

const handleDragStart = (event: DragEvent, type: ElementType) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({ type }));
    event.dataTransfer.effectAllowed = 'copy';
  }
};

const handleDragStartCustom = (event: DragEvent, template: CustomElementTemplate) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({ 
      type: template.element.type,
      payload: template.element
    }));
    event.dataTransfer.effectAllowed = 'copy';
  }
};

const getIcon = (type: ElementType) => {
  switch (type) {
    case ElementType.TEXT: return Type;
    case ElementType.IMAGE: return Image;
    case ElementType.TABLE: return Table;
    case ElementType.PAGE_NUMBER: return Type;
    case ElementType.BARCODE: return Barcode;
    case ElementType.QRCODE: return QrCode;
    case ElementType.LINE: return HorizontalRule;
    case ElementType.RECT: return CheckBoxOutlineBlank;
    case ElementType.CIRCLE: return RadioButtonUnchecked;
    default: return Star;
  }
};
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full z-40">
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <h2 class="font-semibold text-gray-700">Elements</h2>
      <p class="text-xs text-gray-500 mt-1">Drag elements to the canvas</p>
    </div>
    
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 bg-white">
      <button 
        @click="activeTab = 'standard'"
        :class="['flex-1 py-3 text-sm font-medium transition-colors relative', activeTab === 'standard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
      >
        Standard
        <div v-if="activeTab === 'standard'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
      </button>
      <button 
        @click="activeTab = 'custom'"
        :class="['flex-1 py-3 text-sm font-medium transition-colors relative', activeTab === 'custom' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
      >
        Custom
        <div v-if="activeTab === 'custom'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Standard Elements Tab -->
      <template v-if="activeTab === 'standard'">
        <div v-for="category in categories" :key="category.title" class="p-4 border-b border-gray-100 last:border-0">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{{ category.title }}</h3>
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="item in category.items" 
              :key="item.type"
              class="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-move transition-all"
              draggable="true"
              @dragstart="(e) => handleDragStart(e, item.type)"
            >
              <component :is="item.icon" class="w-8 h-8 text-gray-600 mb-2" />
              <span class="text-sm font-medium text-gray-700">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Elements Tab -->
      <template v-if="activeTab === 'custom'">
        <div v-if="customElements.length === 0" class="p-6 text-center">
          <p class="text-sm text-gray-500">No custom elements saved yet.</p>
        </div>
        <div v-else class="p-4 grid grid-cols-2 gap-3">
          <div 
            v-for="item in customElements" 
            :key="item.id"
            class="group relative flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-move transition-all"
            draggable="true"
            @dragstart="(e) => handleDragStartCustom(e, item)"
          >
            <component :is="getIcon(item.element.type)" class="w-8 h-8 text-gray-600 mb-2" />
            <span class="text-sm font-medium text-gray-700 truncate w-full text-center" :title="item.name">{{ item.name }}</span>
            
            <button 
              @click.stop="store.removeCustomElement(item.id)"
              class="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Delete class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>
