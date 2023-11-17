/**
 * Sets the disabled attribute on field
 *
 * @returns {true|undefined}
 */
export const disabledOption = (item, isDisabled) => {
  if (isDisabled === true) {
    return true;
  }

  return (typeof item.disabled === 'boolean' && item.disabled === true)
    ? true
    : undefined;
};

/**
 * Get the option list as an array (rather than an array nested
 * within an object)
 *
 * @param {Object|Array} optionList
 *
 * @returns {Array}
 */
const getListOptions = (optionList) => {
  const output = (typeof optionList.SelectOptionItems !== 'undefined')
    ? optionList.SelectOptionItems
    : optionList;

  if (!Array.isArray(output)) {
    throw new Error(`Expected optionList to have an array. Found ${typeof output}`);
  }

  return output;
};

/**
 * Find the selected option based on the supplied value
 *
 * @param {<{Value: string, Key: string|number}>[]} optionList List
 *                              of Key/Value pairs
 * @param {string|number} value Currently selected value
 *
 * @returns {Array} one option from the supplied array if an item
 *                  was found to match the value.
 *                  Empty array if no match was found
 */
export const findSelectedOption = (optionList, value) => {
  for (let a = 0; a < optionList.length; a += 1) {
    if (optionList[a].value === value) {
      return [optionList[a]];
    }
  }

  return [];
};

/**
 * Get a list of objects to be used passed <PrettySelect> options
 *
 * Output objects have
 * * `key`   property which is used as the option Value
 * * `value` property which is used as the option's label (what
 * *         the end user sees)
 *
 * @param {Array} optionList
 * @returns {array}
 */
export const getKeyValueOptions = (optionList) => {
  const _list = getListOptions(optionList);

  return _list.map((oneOption) => { // eslint-disable-line
    return {
      key: oneOption.Value,
      value: oneOption.Key,
    };
  });
};

/**
 * Get the human readable version of the user selected value, or the
 * previous human readable version the value if user selected value
 * was invalid.
 *
 * @param {Object|Array}  optionList List of select options a value
 *                                   should be found in.
 * @param {string|number} newValue   New value user has selected
 * @param {string|number} oldValue   Previous human readable version
 *                                   of value
 *
 * @returns {string|number}
 */
export const getSelectedLabel = (optionList, newValue, oldValue = '') => {
  const option = findSelectedOption(optionList, newValue);

  return (option.length > 0)
    ? option[0].label
    : oldValue;
};

/**
 * Get a pure function that can be passed to Array.map() to normalise
 * the shape of options to ensure they work in a standard way for
 * RadioSelectInput.
 *
 * @param {string|number} defaultVal default value preset by data
 *                                   from the server
 *
 * @returns {function} A function that can be passed to Array.Map()
 *                     that will normalise options for use by
 *                     `RadioSelectInput`
 */
const getNormaliseSingleOption = (defaultVal) => (item) => {
  const t = typeof item;
  let _val = '';
  let _label = '';
  let vProp = '';
  let lProp = '';

  if (t === 'string' || t === 'number') {
    _val = item;
    _label = _val;
  } else {
    if (typeof item.label !== 'undefined') {
      lProp = 'label';
      vProp = (typeof item.value !== 'undefined')
        ? 'value'
        : 'label';
    } else if (typeof item.key !== 'undefined') {
      vProp = 'key';
      lProp = (typeof item.value !== 'undefined')
        ? 'value'
        : 'key';
    } else if (typeof item.Value !== 'undefined') {
      vProp = 'Value';
      lProp = (typeof item.Key !== 'undefined')
        ? 'Key'
        : 'Value';
    } else if (typeof item.Key !== 'undefined') {
      lProp = 'Key';
      vProp = (typeof item.Key !== 'undefined')
        ? 'Key'
        : 'Value';
    } else if (typeof item.Name !== 'undefined') {
      lProp = 'Name';
      vProp = (typeof item.Id !== 'undefined')
        ? 'Id'
        : 'Name';
    }

    if (vProp === '' || lProp === '') {
      throw new Error(
        'Could not determine either the `value` or `label` '
        + `property of option: "${item.toString()}"`,
      );
    }

    _val = item[vProp];
    _label = item[lProp];
  }

  if (typeof _val !== 'string') {
    _val = _val.toString();
  }

  if (typeof _label !== 'string') {
    _label = _label.toString();
  }

  const _def = (typeof item.default !== 'undefined')
    ? item.default
    : (defaultVal === _val);

  return {
    ...item,
    value: _val,
    label: _label,
    default: _def,
  };
};

/**
 * Remove duplicate options from list of options
 *
 * @param {array}   options List of options for RadioSelectInput that
 *                          needs to have duplicates removed
 * @param {boolean} dedupe  Whether or not to actually remove
 *                          duplicates
 *
 * @returns {array} If `dedupe` is `FALSE`, then input options is
 *                  returned unmodified. If `dedupe` is `TRUE` then
 *                  and options that the same key or label as
 *                  preceeding option will be removed.
 */
const deDupeOptions = (options, dedupe) => {
  if (dedupe === false) {
    return options;
  }

  const knownLabels = [];
  const knownValues = [];
  const output = [];

  for (let a = 0; a < options.length; a += 1) {
    if (knownValues.indexOf(options[a].value) === -1
      && knownLabels.indexOf(options[a].label) === -1
    ) {
      knownValues.push(options[a].value);
      knownLabels.push(options[a].label);
      output.push(options[a]);
    }
  }

  return output;
};

/**
 * Normalise option objects so they have expected properties
 *
 * @param {<string|number|Object>[]} options List of options
 *
 * @returns {Object[]}
 */
export const normaliseOptions = (options, defaultVal, dedupe = false) => {
  let _options = [];

  if (Array.isArray(options) === false && typeof options === 'object') {
    const output = [];
    const keys = Object.keys(options);

    for (let a = 0; a < keys.length; a += 1) {
      const key = keys[a];
      output.push({ value: key, label: options[key] });
    }

    _options = output;
  } else {
    _options = [...options];
  }

  return deDupeOptions(
    _options.map(getNormaliseSingleOption(defaultVal)),
    dedupe,
  );
};

/**
 * Add an ID string for each item in the array.
 *
 * @param {string} fieldID ID for the label for the whole radio group
 *
 * @returns {Function} A function that can be passed to Array.map()
 */
export const setOptionIDs = (fieldID) => (item, index) => ({
  ...item,
  id: typeof item.id === 'string'
    ? item.id
    : `${fieldID}--${index}`,
});

/**
 * Check whether a boolean attribute should be present
 *
 * @param {object}  item     Item to have the attribute
 * @param {string}  key      Property key for the attribute
 * @param {boolean} override Override for the whole list of items
 *
 * @returns {true|undefined} `TRUE` if the override is true or the
 *                           item's property value is boolean and
 *                           true. `FALSE` otherwise
 */
export const itemIsTrue = (item, key, override = false) => {
  if (override === true) {
    return true;
  }

  return (typeof item[key] === 'boolean' && item[key] === true)
    ? true
    : undefined;
};

/**
 * Remove any empty options from select field options
 *
 * (Used when no-non-empty is set to remove the empty option after
 * a non-empty option has been selected)
 *
 * @param {Object[]} option list of options for select field
 */
export const removeEmptyFilter = (option) => (option.value.trim() !== '');
