<script setup lang="ts">
import type { PrintElement } from '@/types';

defineProps<{
  element: PrintElement;
}>();
</script>

<script lang="ts">
import type { ElementPropertiesSchema } from '@/types';
export const elementPropertiesSchema: ElementPropertiesSchema = {
  sections: [
    {
      title: 'Data & Behavior',
      tab: 'properties',
      fields: [
        { label: 'Auto Paginate', type: 'switch', target: 'element', key: 'autoPaginate' },
        { label: 'Data (JSON)', type: 'textarea', target: 'element', key: 'data', placeholder: '[{...}]' }
      ]
    },
    {
      title: 'Layout',
      tab: 'style',
      fields: [
        { label: 'Header Height (px)', type: 'number', target: 'style', key: 'headerHeight', min: 20, max: 200, step: 1 },
        { label: 'Row Height (px)', type: 'number', target: 'style', key: 'rowHeight', min: 20, max: 200, step: 1 }
      ]
    },
    {
      title: 'Border',
      tab: 'style',
      fields: [
        { label: 'Border Width (px)', type: 'number', target: 'style', key: 'borderWidth', min: 0, max: 20, step: 1 },
        { label: 'Border Color', type: 'color', target: 'style', key: 'borderColor' }
      ]
    }
  ]
};
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-white">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th 
            v-for="col in element.columns" 
            :key="col.field"
            class="border p-1 text-left bg-gray-100 font-bold text-sm"
            :style="{ width: `${col.width}px` }"
          >
            {{ col.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in element.data" :key="i">
          <td 
            v-for="col in element.columns" 
            :key="col.field"
            class="border p-1 text-sm"
          >
            {{ row[col.field] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
