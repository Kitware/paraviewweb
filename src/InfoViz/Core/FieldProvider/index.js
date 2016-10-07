import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

const DEFAULT_FIELD_STATE = {
  range: [0, 1],
  active: false,
};

const PROVIDER_NAME = 'FieldProvider';

// ----------------------------------------------------------------------------
// Field Provider
// ----------------------------------------------------------------------------

function fieldProvider(publicAPI, model) {
  if (!model.fields) {
    model.fields = {};
  }

  const triggerFieldChange = (field) => {
    if (publicAPI.isA('PersistentStateProvider')) {
      publicAPI.setPersistentState(PROVIDER_NAME, model.fields);
    }
    publicAPI.fireFieldChange(field);
  };

  publicAPI.loadFieldsFromState = () => {
    let count = 0;
    if (publicAPI.isA('PersistentStateProvider')) {
      const storageItems = publicAPI.getPersistentState(PROVIDER_NAME);
      Object.keys(storageItems).forEach((storeKey) => {
        publicAPI.updateField(storeKey, storageItems[storeKey]);
        count += 1;
      });
    }
    return count;
  };

  publicAPI.getFieldNames = () => {
    const val = Object.keys(model.fields);
    if (model.fieldsSorted) val.sort();
    return val;
  };

  publicAPI.getActiveFieldNames = () => {
    const val = Object.keys(model.fields).filter(name => model.fields[name].active);
    if (model.fieldsSorted) val.sort();
    return val;
  };

  publicAPI.addField = (name, initialState = {}) => {
    const field = Object.assign({}, DEFAULT_FIELD_STATE, initialState, { name });
    field.range = [].concat(field.range); // Make sure we copy the array
    model.fields[name] = field;
    triggerFieldChange(field);
  };

  publicAPI.getField = name => model.fields[name];

  publicAPI.updateField = (name, changeSet = {}) => {
    const field = model.fields[name] || {};
    let hasChange = false;

    Object.keys(changeSet).forEach((key) => {
      hasChange = hasChange || JSON.stringify(field[key]) !== JSON.stringify(changeSet[key]);
      // Set changes
      field[key] = changeSet[key];
    });

    if (hasChange) {
      field.name = name; // Just in case
      model.fields[name] = field;
      triggerFieldChange(field);
    }
  };

  publicAPI.toggleFieldSelection = (name) => {
    model.fields[name].active = !model.fields[name].active;
    triggerFieldChange(model.fields[name]);
  };

  publicAPI.removeAllFields = () => {
    model.fields = {};
    triggerFieldChange();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fields: null,
  fieldsSorted: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, PROVIDER_NAME);
  CompositeClosureHelper.event(publicAPI, model, 'FieldChange');
  CompositeClosureHelper.get(publicAPI, model, ['fieldsSorted']);
  CompositeClosureHelper.set(publicAPI, model, ['fieldsSorted']);

  fieldProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
