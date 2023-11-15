<template>
  <span class="vue-select">
    <button
      class="vue-select__btn"
      role="combobox"
      :aria-labelledby="fieldId"
      aria-haspopup="listbox"
      :aria-expanded="expanded"
      aria-controls="vue-select-dropdown"
      v-on:click="btnClick">
      <span v-if="unsafeLabels === true" v-html="current.label"></span>
      <span v-else>{{ current.label }}</span>
    </button>
    <ul
      :class="listClass"
      :key="expanded"
      ref="vue-select-list"
      role="listbox"
      :id="dropdownID">
      <li
        v-for="(option, index) in options"
        class="vue-select__option"
        :key="option.value"
        role="option">
        <input
          class="vue-select__radio"
          :disabled="option.disabled"
          :id="radioID(index)"
          :name="radioName"
          type="radio"
          :value="option.value"
          v-on:change="optionHandler($event)"
          v-on:click="selectOption($event)"
          v-on:keyup.enter="selectOption($event)" />
        <label
          class="vue-select__label"
          :for="radioID(index)">
          <span v-if="options.icon" class="vue-select__opt-icon"></span>
          <span
            v-if="unsafeLabels === true"
            class="vue-select__opt-txt"
            v-html="option.label"></span>
          <span
            v-else
            class="vue-select__opt-txt">{{ index }} - {{ option.label }}</span>
        </label>
      </li>
    </ul>
    <button class="vue-select__close" v-on:click="closeClick(event)" v-on:focus="closeClick(event)">Close</button>
  </span>
</template>

<script setup>
import { cloneVNode, computed, defineEmits, onBeforeMount, ref } from 'vue'

/**
 * @typedef OptObj
 * @type {object}
 *
 * @property {string}  value    Value that the server cares about
 * @property {string}  label    Value to show to humans
 * @property {boolean} default  Whether or not the option should be
 *                              rendered as the default
 * @property {boolean} disabled Whether or not this options is
 *                              disabled
 */

const props = defineProps({
  fieldId: { type: String, required: true },
  /**
   * List of options to be rendered for the select
   *
   * @property {Array<OptObj>}
   */
  options: { type: Array, required: true },
  required: { type: Boolean, required: false, default: false },
  unsafeLabels: { type: Boolean, required: false, default: false },
  value: { type: String, required: false, default: '' },
});

const emits = defineEmits(['change', 'invalid']);

const current = ref(null);
const expanded = ref(false);
const dropdownID = computed(() => `${props.fieldId}--dropdown`);
const radioName = computed(() => `${props.fieldId}--radio`);
const expandedStr = computed(() => expanded.value === 'true' ? 'true' : 'false');

const listClass = computed(() => {
  const tmp = 'vue-select__list';

  return (expanded.value === true)
    ? `${tmp} ${tmp}--expanded`
    : tmp;
})

// const labelClass = (option) => {
//   const tmp = 'vue-select__option';

//   return (option.value === current.value)
//     ? `${tmp} ${tmp}--selected`
//     : tmp;
// }

const radioID = (i) => `${radioName}--${i}`;

// const btnFocus = (event) => {
//   expanded.value = true;
// }
const btnClick = (event) => {
  expanded.value = !expanded.value;
}

const closeClick = (event) => {
  expanded.value = false;
}

const optionHandler = (event) => {
  console.group('optionHandler()');
  if (typeof event !== 'undefined') {
    console.log('event.type:', event.type);
  }
  console.groupEnd();
}

const selectOption = (event) => {

}

onBeforeMount(() => {
  let tmp = null;

  if (props.value !== '') {
    tmp = props.options.find((option) => option.value === props.value);
    current.value = (typeof tmp !== 'undefined')
      ? tmp
      : null;
  } else {
    tmp = props.options.find((option) => option.default === true);
    current.value = (typeof tmp !== 'undefined')
      ? tmp
      : props.options[0];
  }
})
</script>

<style lang="scss">
$arrow-colour: #fff;
$border-colour: #eee;
$outline-colour: #44c;
$selected-colour: #111;

.vue-select {
  position: relative;
  display: block;
  max-width: 20rem;
  z-index: 1;

  &:focus-within {
    outline: 0.1rem solid $outline-colour;
    outline-offset: 0.3rem;
  }

  &__btn {
    display: block;
    width: 100%;
    background-color: transparent;
    border: 0.05rem solid $border-colour;
    border-radius: 0;
    padding: 0.75rem 2rem 0.75rem 1rem;
    min-height: 3.5rem;
    position: relative;
    width: 20rem;
    z-index: 10;

    &::after {
      content: '';
      border-left: 0.2rem solid $arrow-colour;
      border-bottom: 0.2rem solid $arrow-colour;
      position: absolute;
      top: 50%;
      right: 1rem;
      width: 0.5rem;
      height: 0.5rem;
      display: inline-block;
      transform: translateY(-65%) rotate(315deg);
      transition: transform ease-in-out 0.3s;
    }

    &[aria-expanded=true] {
      &::after {
        transform: translateY(-50%) rotate(135deg);
      }

      ~ .vue-select__close {
        height: 100%;
        width: 100%;
      }
    }
  }

  &__close {
    background-color: transparent;
    border: none;
    color: transparent;
    cursor: auto;
    height: 0;
    position: fixed;
    right: 0;
    top: 0;
    width: 0;
    z-index: 2;
  }

  &__label {
    padding: 0.25rem 1rem;
    cursor: pointer;
    min-height: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    border-bottom: 0.05rem solid transparent;
    border-top: 0.05rem solid transparent;
  }

  &__radio:checked + .vue-select__label {
    border-bottom: 0.05rem solid $border-colour;
    border-top: 0.05rem solid $border-colour;
  background-color: $selected-colour;
  }

  &__list {
    list-style-type: none;
    margin: 0;
    padding: 0;
    text-align: left;
    border-left: 0.05rem solid $border-colour;
    border-right: 0.05rem solid $border-colour;
    display: none;
    position: absolute;
    top: 3rem;
    z-index: 10;

    &--expanded {
      display: block;
    }
  }

  &__option {
    border-top: 0.05rem solid $border-colour;
    border-bottom: 0.05rem solid $border-colour;
    border-left: 0.25rem solid transparent;
    margin-left: -0.05rem;

    &:first-child {
      border-top: none;
    }

    // &:last-child {
    //   border-bottom: none;
    // }

    &:hover, &:focus-within {
      border-left-color: $border-colour;
      cursor: pointer;
    }
  }

  &__radio {
    border: 0 !important;
    clip: rect(0,0,0,0) !important;
    height: 1px !important;
    margin: -1px !important;
    overflow: hidden !important;
    padding: 0 !important;
    position: absolute !important;
    white-space: nowrap !important;
    width: 1px !important;
  }
}
</style>
