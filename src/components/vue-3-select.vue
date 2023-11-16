<template>
  <span :class="wrapClass">
    <button
      :aria-controls="dropdownID"
      :aria-expanded="expanded"
      aria-haspopup="listbox"
      :aria-labelledby="fieldId"
      :class="btnClass"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :key="btnClass"
      ref="vueSelectOpen"
      role="combobox"
      :tabindex="tabIndex"
      type="button"
      v-on:click="btnClick"
      v-on:keyup.down="selectNext"
      v-on:keyup.left="selectPrevious"
      v-on:keyup.right="selectNext"
      v-on:keyup.up="selectPrevious">
      <span
        v-if="unsafeLabels === true"
        v-html="current.label"
        class="vue-select__btn__inner"></span>
      <span v-else class="vue-select__btn__inner">{{ current.label }}</span>
    </button>

    <ul
      :class="listClass"
      :id="dropdownID"
      :key="expanded"
      ref="vueSelectList"
      role="listbox">
      <li
        v-for="(option, index) in options"
        class="vue-select__option"
        :key="option.value"
        role="option"
        :aria-selected="option.value === current.value">
        <input
          class="vue-select__radio"
          :disabled="option.disabled"
          :id="radioID(index)"
          :key="expanded"
          :name="radioName"
          type="radio"
          :tabindex="childTabIndex"
          :value="option.value"
          v-on:change="optionChange($event)"
          v-on:click="optionSelected($event)"
          v-on:keyup.enter="optionSelected($event)"
          v-on:keyup.esc="closeClick()"
          v-on:keyup.space="optionSelected($event)" />
        <label
          class="vue-select__label vue-select__opt-wrap"
          :for="radioID(index)">
          <span
            v-if="unsafeLabels === true"
            class="vue-select__opt-txt"
            v-html="option.label"></span>
          <span
            v-else
            class="vue-select__opt-txt">{{ option.label }}</span>
        </label>
      </li>
    </ul>

    <button
      class="vue-select__close"
      :tabindex="childTabIndex"
      type="button"
      v-on:click="closeClick()"
      v-on:focus="closeClick()">Close</button>
  </span>
</template>

<script setup>
import {
  computed,
  defineEmits,
  nextTick,
  onBeforeMount,
  ref,
} from 'vue';

// --------------------------------------------------
// START: Emitted events

const emit = defineEmits(['blur', 'change', 'closed', 'invalid']);

//  END:  Emitted events
// --------------------------------------------------
// START: Properties/attributes

/**
 * @typedef OptionProps
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
   * Sometimes you need the dropdown to always drop up (sit above the
   * main button)
   *
   * @property {boolean} forceAbove
   */
  forceAbove: { type: Boolean, required: false, default: false },

  /**
   * Whether or not this field is disabled.
   *
   * @property {boolean} isDisabled
   */
  isDisabled: { type: Boolean, required: false, default: false },

  /**
   * Whether or not this field is in read only mode.
   *
   * @property {boolean} isReadonly
   */
  isReadonly: { type: Boolean, required: false, default: false },

  /**
   * Whether or not this field is required.
   *
   * @property {boolean} required
   */
  isRequired: { type: Boolean, required: false, default: false },

  /**
   * Whether or not to loop the currently selected option when using
   * keyboard arrows for selecting options.
   *
   * i.e. If I press the down (or right) arrow, by default when I get
   *      to the last option, pressing the down arrow will not do
   *      anything. If `props.loop` is TRUE, when I press the down
   *      (or right) arrow on the last option, the first option in
   *      the list will be selected.
   *
   * @property {boolean} loop
   */
  loop: { type: Boolean, required: false, default: false },
  /**
   * List of options to be rendered for the select
   *
   * @property {Array<OptionProps>}
   */
  options: { type: Array, required: true },

  /**
   * The tabindex value for the primary button element
   *
   * @property {number} tabIndex
   */
  tabIndex: { type: Number, required: false, default: 0 },

  /**
   * Sometimes you want the labels for an option to have extra
   * styling or markup. If you set `props.unsaveLabels` to TRUE, you
   * can put HTML into the option's label property and that markup
   * will be rendered as the visible content for the option.
   *
   * @property {boolean} unsafeLabels
   */
  unsafeLabels: { type: Boolean, required: false, default: false },

  /**
   * Default (pre-selected) value for the select list
   *
   * > __Note:__ if value is empty the first option in the
   * >           `props.options` list will be used as the default.
   */
  value: { type: String, required: false, default: '' },
});

//  END:  Properties/attributes
// --------------------------------------------------
// START: Local state

/**
 * Whether or not to render the option list above the main button
 *
 * Normally the
 *
 * @var {boolean}
 */
const above = ref(false);

/**
 * All the properties for the currently selected option
 *
 * (NULL if no valid option is selected)
 *
 * @var {OptionProps}
 */
const current = ref(null);

/**
 * Index of the currently selected option
 *
 * @var {number}
 */
const currentIndex = ref(0);

/**
 * Whether or not the select dropdown is expanded or collapsed
 *
 * @var {boolean}
 */
const expanded = ref(false);

/**
 * Whether or not user interactions are temporarily frozen
 *
 * This is used to prevent the dropdown from automatically closing
 * when it is opened.
 *
 * @var {boolean}
 */
const freeze = ref(false);

/**
 * Whether or not user interactions are temporarily frozen
 *
 * This is used to prevent the dropdown from automatically closing
 * when it is opened.
 *
 * @var {boolean}
 */
const unusable = ref(false);

/**
 * The wrapping UL tag for the options list
 *
 * Used for setting focus on the approptiate option when the dropdown
 * is expanded
 *
 * @var {HTMLListELement}
 */
const vueSelectList = ref(null);

/**
 * The primary button for the select dropdown
 *
 * Used for returning focus to the button after the dropdown has been
 * closed by faux blur event
 *
 * @var {HTMLButtonElement}
 */
const vueSelectOpen = ref(null);

//  END:  Local state
// --------------------------------------------------
// START: Computed properties

const btnClass = computed(() => {
  const tmp = 'vue-select__';

  let output = `${tmp}btn ${tmp}btn--`;

  output += (above.value === true)
    ? 'above'
    : 'below';

  return `${output} ${tmp} ${tmp}opt-wrap`;
});

/**
 * Tabindex value for options and close button
 *
 * @var {number}
 */
const childTabIndex = computed(() => { // eslint-disable-line arrow-body-style
  return (expanded.value === true)
    ? 0
    : -1;
});

/**
 * ID used for the dropdown list
 *
 * Used for linking the dropdown list to the button via aria
 * attributes.
 *
 * @var {string}
 */
const dropdownID = computed(() => `${props.fieldId}--dropdown`);

/**
 * Classes used for the dropdown list
 *
 * @var {string}
 */
const listClass = computed(() => {
  const tmp = 'vue-select__list';

  let output = (expanded.value === true)
    ? `${tmp} ${tmp}--expanded`
    : tmp;

  if (above.value === true) {
    output += ` ${tmp}--above`;
  }

  return output;
});

/**
 * Last index for the option list
 *
 * @var {number}
 */
const maxIndex = computed(() => (props.options.length - 1));

/**
 * Name attribute for all the radio input fields.
 *
 * @var {string}
 */
const radioName = computed(() => `${props.fieldId}--radio`);

const wrapClass = computed(() => {
  const tmp = 'vue-select';

  return (expanded.value === true)
    ? `${tmp} ${tmp}--expanded`
    : tmp;
});

//  END:  Computed properties
// --------------------------------------------------
// START: Local methods

/**
 * Make sure the select list is visable
 *
 * @returns {void}
 */
const setAbove = () => {
  const bound = vueSelectOpen.value.getBoundingClientRect();

  above.value = (props.forceAbove === true || (window.innerHeight - bound.bottom) < 290);
};

/**
 * Get the ID for a given radio input field
 *
 * @param {number} i
 *
 * @returns {string}
 */
const radioID = (i) => `${radioName.value}--${i}`;

/**
 * Check whether the current state of the select is invalid
 *
 * @returns {boolean}
 */
const isInvalid = () => (current.value === null || (props.isRequired === true
  && current.value.value === ''));

/**
 * Handle clicks to the primary button
 *
 * @returns void
 */
const btnClick = () => {
  if (unusable.value === false && freeze.value === false) {
    expanded.value = !expanded.value;
    const bound = vueSelectOpen.value.getBoundingClientRect();

    above.value = ((window.innerHeight - bound.bottom - bound.height) < 304);

    if (expanded.value === true) {
      setAbove();

      vueSelectList.value.children[currentIndex.value].firstElementChild.tabIndex = 0;
      freeze.value = true;
      expanded.value = true;

      // To ensure that the focus is updated, we need to wait a tick
      // while the tabindex is updated so we set focus on the next tick
      nextTick(() => {
        vueSelectList.value.children[currentIndex.value].firstElementChild.focus();

        // To prevent the dropdown automatically closing after a
        // keyboard triggered click event, we freeze the ability to
        // close the dropdown for half a second.
        setTimeout(() => {
          freeze.value = false;
        }, 500);
      });

      emit('closed', false);
    } else {
      emit('closed', true);
    }
  }
};

const emitChange = (type = 'change') => {
  if (unusable.value === false) {
    emit(type, current.value);
    emit('invalid', isInvalid());
  }
};

/**
 * Handle closing/collapsing the select/dropdown list
 *
 * @returns {void}
 */
const closeClick = () => {
  if (freeze.value === false && unusable.value === false) {
    expanded.value = false;

    emitChange('blur');
    emit('closed', true);
    vueSelectOpen.value.focus();
  }
};

/**
 * Update the current value and index of the selected option
 *
 * @param {string} value
 *
 * @returns {boolean} TRUE if a valid option was selected.
 *                    FALSE otherwise
 */
const setCurrentValue = (value) => {
  if (unusable.value === false) {
    for (let a = 0; a < props.options.length; a += 1) {
      if (props.options[a].value === value) {
        current.value = props.options[a];
        currentIndex.value = a;
        return true;
      }
    }
  }

  currentIndex.value = 0;
  current.value = null;

  return false;
};

/**
 * Update the current value after arrow click and ensure that the
 * right radio button is checked.
 *
 * @returns {void}
 */
const setSelected = () => {
  if (unusable.value === false) {
    current.value = props.options[currentIndex.value];
    vueSelectList.value.children[currentIndex.value].checked = true;

    emitChange();
  }
};

/**
 * Update the current value and current index after the left or up
 * arrow key has been pressed (and released) from within the main
 * button so that the new seleted option is the previous option in
 * the list.
 *
 * @returns {void}
 */
const selectPrevious = () => {
  if (unusable.value === false) {
    if (currentIndex.value > 0) {
      currentIndex.value -= 1;
    } else if (props.loop === true) {
      currentIndex.value = maxIndex.value;
    }

    setSelected();
  }
};

/**
 * Update the current value and current index after the right or down
 * arrow key has been pressed (and released) from within the main
 * button so that the new seleted option is the next option in the list.
 *
 * @returns {void}
 */
const selectNext = () => {
  if (unusable.value === false) {
    if (currentIndex.value < maxIndex.value) {
      currentIndex.value += 1;
    } else if (props.loop === true) {
      currentIndex.value = 0;
    }

    setSelected();
  }
};

/**
 * Handle radio button input change event
 *
 * @param {Event} event
 *
 * @returns {void}
 */
const optionChange = (event) => {
  if (unusable.value === false) {
    setCurrentValue(event.target.value);

    emitChange();
  }
};

/**
 * Handle user clicking on an option (or pressing "Enter" or "Space")
 * while focused on an option.
 *
 * @param {Event} event
 *
 * @returns {void}
 */
const optionSelected = (event) => {
  if (unusable.value === false) {
    setCurrentValue(event.target.value);

    if (freeze.value === false) {
      if (event.type !== 'click' || (event.clientX !== 0 && event.clientY !== 0)) {
        expanded.value = false;
        vueSelectOpen.value.focus();
        emitChange();
      }
    }
  }
};

//  END:  Local methods
// --------------------------------------------------
// START: Lifecycle methods

onBeforeMount(() => {
  setCurrentValue(props.value);

  if (current.value === null) {
    current.value = props.options[0]; // eslint-disable-line prefer-destructuring
  }

  unusable.value = (props.isDisabled === true || props.isReadonly === true);
  above.value = (props.forceAbove === true);
});

//  END:  Lifecycle methods
// --------------------------------------------------
</script>

<style lang="scss">
@import '../assets/components/shared-components/pretty-select';
</style>
