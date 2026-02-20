<script setup lang="ts">
import PrintDesigner from './components/PrintDesigner.vue';
import PrintRenderer from './components/print/PrintRenderer.vue';

const isPrintRenderer = new URLSearchParams(window.location.search).get('print') === '1';
</script>

<template>
  <PrintRenderer v-if="isPrintRenderer" />
  <PrintDesigner v-else />
</template>
