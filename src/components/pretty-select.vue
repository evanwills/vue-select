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
        v-for="(option, index) in usableOptions"
        class="vue-select__option"
        :key="option.value"
        role="option"
        :aria-selected="option.value === current.value">
        <input
          class="vue-select__radio"
          :disabled="disabledOption(option, isDisabled)"
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
import { disabledOption, normaliseOptions, removeEmptyFilter } from './radio-select.utils';

// --------------------------------------------------
// START: Emitted events

const emit = defineEmits(['blur', 'change', 'closed', 'invalid']);

const ePre = (method, before = null) => {
    const t = typeof before;
    let suffix = '';

    if (t === 'boolean') {
      suffix = (before === true)
        ? ' (before)'
        : ' (after)';
    } else if (t === 'string') {
      const _before = before.trim();
      if (_before !== '') {
        suffix = ` ("${_before}")`;
      }
    }

    return `pretty-select.${method}()${suffix} `;
  };

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
  /**
   * Whether or not to remove duplicate options from options list.
   *
   * @property {boolean} dedupe
   */
  dedupe: { type: Boolean, required: false, default: false },

  /**
   * For select fields where no default is currently set, this
   * provides an indicator that the user must choose an option
   *
   * (Is inserted as the first item in a select list)
   *
   * @property {string} emptyTxt
   */
  emptyTxt: { type: String, required: false, default: '' },

  /**
   * ID of the field being rendered
   *
   * Used to link the field to its label, error message and help
   * text
   *
   * @property {string} errorMsg
   */
  fieldId: { type: String, required: true },

  /**
   * Sometimes you need the dropdown to always drop up (sit above the
   * main button)
   *
   * @property {boolean} forceAbove
   */
  forceAbove: { type: Boolean, required: false, default: false },

  /**
   * Sometimes it's useful to get the full option object on a change
   * or blur event. If the client code needs the full option, then
   * set `full-option` attribute in the client
   *
   * @property {boolean} fullOption
   */
  fullOption: { type: Boolean, required: false, default: false },

  /**
   * IDs for error and help text blocks to use as value for
   * `aria-describedby` attribute
   *
   * Used to link the field to its label, error message and help
   * text
   *
   * @property {string} errorMsg
   */
  helpIds: { type: String, required: false, default: '' },

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
   * Whether or not to show the empty value if the default value
   * is non-empty
   *
   * @property {boolean} noNonEmpty
   */
  noNonEmpty: { type: Boolean, required: false, default: false },

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
 * List of options to be rendered
 *
 * Each option object has the following properties
 *
 * @property {Array<OptionProps>}
 */
const usableOptions = ref([]);

/**
 * Whether or not to render the empty option for <SELECT>
 * fields
 *
 * Only ever true if `no-non-empty` is set and the `value`
 * attribute on this component is an empty string
 *
 * @property {boolean} useEmpty
 */
const useEmpty = ref(false);

/**
 * Whether or not the empty option(s) have already been removed
 *
 * @property {boolean} emptyRemoved
 */
const emptyRemoved = ref(false);

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

/**
 * Class list for the main button element
 *
 * @returns {string}
 */
const btnClass = computed(() => {
  const tmp = 'vue-select__';
  const placement = (above.value === true)
    ? 'above'
    : 'below';

  return `${tmp}btn ${tmp}btn--${placement} ${tmp}opt-wrap`;
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
const maxIndex = computed(() => (usableOptions.value.length - 1));

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
    emit(
      type,
      (props.fullOption === true)
        ? current.value
        : current.value.value,
    );
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
 * Remove empty option(s) from list of usable options
 */
const removeEmpty = () => {
  if (emptyRemoved.value === false
    && props.noNonEmpty === true
    && current.value !== null
    && current.value.value.trim() !== ''
  ) {
    usableOptions.value = usableOptions.value.filter(removeEmptyFilter);
    emptyRemoved.value = true;
  }
};

/**
 * Update the current value and index of the selected option
 *
 * @param {string} value
 *
 * @returns {void}
 */
const setCurrentValue = (value) => {
  for (let a = 0; a < usableOptions.value.length; a += 1) {
    if (usableOptions.value[a].value === value) {
      current.value = usableOptions.value[a];
      currentIndex.value = a;
      removeEmpty();

      return;
    }
  }

  currentIndex.value = 0;
  current.value = null;
};

/**
 * Update the current value after arrow click and ensure that the
 * right radio button is checked.
 *
 * @returns {void}
 */
const setSelected = () => {
  if (unusable.value === false) {
    current.value = usableOptions.value[currentIndex.value];
    vueSelectList.value.children[currentIndex.value].checked = true;
    removeEmpty();
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

/**
 * Make option list usable for <SELECT> and/or <INPUT type="radio" />
 *
 * Normalise key/value pairs
 */
const setUsableOptions = () => {
  // Make sure options are useable
  let options = normaliseOptions(
    usableOptions.value,
    (current.value !== null)
      ? current.value.value
      : props.value,
    props.dedupe,
  );

  options = (useEmpty.value === true)
    ? [{ value: '', label: props.emptyTxt }, ...options]
    : options;

  // Give each radio option a unique ID
  usableOptions.value = options;
};

//  END:  Local methods
// --------------------------------------------------
// START: Lifecycle methods

onBeforeMount(() => {
  useEmpty.value = (props.noNonEmpty === false || props.value === '');
  usableOptions.value = props.options;

  setUsableOptions();
  removeEmpty();

  setCurrentValue(props.value);

  if (current.value === null) {
    current.value = usableOptions.value[0]; // eslint-disable-line prefer-destructuring
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
