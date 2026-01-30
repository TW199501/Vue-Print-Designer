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
      title: 'Appearance',
      tab: 'style',
      fields: [
        { label: 'Background', type: 'color', target: 'style', key: 'backgroundColor', defaultValue: 'transparent' },
        { label: 'Border Color', type: 'color', target: 'style', key: 'borderColor', defaultValue: '#000000' },
        { label: 'Border Width (px)', type: 'number', target: 'style', key: 'borderWidth', min: 0, max: 100, defaultValue: 1 },
        { label: 'Border Style', type: 'select', target: 'style', key: 'borderStyle', defaultValue: 'solid', options: [
            { label: 'None', value: 'none' },
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' }
          ]
        }
      ]
    }
  ]
};
</script>

<template>
  <div 
    class="w-full h-full rounded-full"
    :style="{
      backgroundColor: element.style.backgroundColor || 'transparent',
      borderWidth: `${element.style.borderWidth || 1}px`,
      borderStyle: element.style.borderStyle || 'solid',
      borderColor: element.style.borderColor || '#000000'
    }"
  ></div>
</template>
