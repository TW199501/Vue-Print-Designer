<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
  label: string;
  value: string | number;
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits(['update:value']);

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:value', target.value);
};
</script>

<template>
  <div>
    <label class="block text-xs text-gray-500 mb-1">{{ label }}</label>
    <textarea
      v-if="type === 'textarea'"
      :value="value"
      :placeholder="placeholder"
      @input="handleInput"
      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none h-24 resize-y"
    ></textarea>
    <input
      v-else
      :type="type || 'text'"
      :value="value"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
    />
  </div>
</template>