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
      title: 'Content',
      tab: 'properties',
      fields: [
        { label: 'Content', type: 'textarea', target: 'element', key: 'content', placeholder: 'Enter text' },
        { label: 'Variable (@foobar)', type: 'text', target: 'element', key: 'variable', placeholder: '@foobar' }
      ]
    },
    {
      title: 'Typography',
      tab: 'style',
      fields: [
        { label: 'Font Size (px)', type: 'number', target: 'style', key: 'fontSize', min: 8, max: 96, step: 1 },
        { label: 'Color', type: 'color', target: 'style', key: 'color' },
        {
          label: 'Text Align',
          type: 'select',
          target: 'style',
          key: 'textAlign',
          options: [
            { label: 'Default', value: '' },
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' }
          ]
        },
        {
          label: 'Font Family',
          type: 'select',
          target: 'style',
          key: 'fontFamily',
          options: [
            { label: 'Default', value: '' },
            { label: 'Arial', value: 'Arial, sans-serif' },
            { label: 'Times New Roman', value: '"Times New Roman", serif' },
            { label: 'Courier New', value: '"Courier New", monospace' },
            { label: 'SimSun (宋体)', value: 'SimSun, serif' },
            { label: 'SimHei (黑体)', value: 'SimHei, sans-serif' }
          ]
        },
        {
          label: 'Font Weight',
          type: 'select',
          target: 'style',
          key: 'fontWeight',
          options: [
            { label: 'Default', value: '' },
            { label: 'Normal', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Bold', value: '700' }
          ]
        }
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
  <div class="w-full h-full overflow-hidden" :style="{
    fontSize: `${element.style.fontSize}px`,
    fontFamily: element.style.fontFamily,
    fontWeight: element.style.fontWeight,
    fontStyle: element.style.fontStyle,
    textAlign: element.style.textAlign,
    color: element.style.color,
    padding: `${element.style.padding}px`,
  }">
    {{ element.variable || element.content || 'Double click to edit' }}
  </div>
</template>
