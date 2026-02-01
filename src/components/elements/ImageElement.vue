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
      title: 'Image Source',
      tab: 'properties',
      fields: [
        { label: 'Image Source', type: 'image', target: 'element', key: 'content', placeholder: 'https://... or upload image' }
      ]
    },
    {
      title: 'Border',
      tab: 'style',
      fields: [
        { label: 'Border Style', type: 'select', target: 'style', key: 'borderStyle', options: [
            { label: 'None', value: 'none' },
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' }
          ]
        },
        { label: 'Border Width (px)', type: 'number', target: 'style', key: 'borderWidth', min: 0, max: 20, step: 1 },
        { label: 'Border Color', type: 'color', target: 'style', key: 'borderColor' }
      ]
    }
  ]
};
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-gray-50 flex items-center justify-center">
    <img 
      v-if="element.content" 
      :src="element.content" 
      class="w-full h-full object-contain pointer-events-none"
      alt="Element"
    />
    <span v-else class="text-gray-400 text-xs">No Image</span>
  </div>
</template>
