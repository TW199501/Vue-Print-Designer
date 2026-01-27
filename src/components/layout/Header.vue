<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HeaderToolbar from './toolbar/HeaderToolbar.vue';
import HelpModal from './help/HelpModal.vue';

const showHelp = ref(false);

const handleKeydown = (e: KeyboardEvent) => {
  const target = e.target as Element | null;
  if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    showHelp.value = true;
    return;
  }
  if (showHelp.value && e.key === 'Escape') {
    showHelp.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-[2000] relative shadow-sm">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">P</div>
      <h1 class="font-semibold text-gray-700">Print Designer</h1>
    </div>

    <HeaderToolbar @toggle-help="showHelp = true" />

    <HelpModal v-model:show="showHelp" />
  </header>
</template>
