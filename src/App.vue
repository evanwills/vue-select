<template>
  <Vue3Select field-id="test-custom-select" :options="options" />
</template>

<script setup>
import { ref } from 'vue';
import Vue3Select from './components/vue-3-select.vue';

const id = ref('custom-select');
const options = ref([
  { value: '', label: '-- please choose --', default: true },
  { value: 'evan', label: 'Evan' },
  { value: 'ivan', label: 'Ivan' },
  { value: 'tarrin', label: 'Tarrin' },
  { value: 'toria', label: 'Toria' },
  { value: 'long', label: 'Rediculously long and silly option that should never be allowed.' },
]);

</script>

<style scoped>
#app {
  min-height: 20rem;
}
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
