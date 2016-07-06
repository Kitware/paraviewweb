import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

const DEFAULT_FIELD_STATE = {
  range: [0, 1],
  active: false,
};
// ----------------------------------------------------------------------------
// Field Provider
// ----------------------------------------------------------------------------

function fieldProvider(publicAPI, model) {
  if (!model.fields) {
    model.fields = {};
  }

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
    publicAPI.fireFieldChange(field);
  };

  publicAPI.getField = (name) => (model.fields[name]);

  publicAPI.updateField = (name, changeSet = {}) => {
    const field = model.fields[name] || {};
    let hasChange = false;

    Object.keys(changeSet).forEach(key => {
      hasChange = hasChange || field[key] !== changeSet[key];
      // Set changes
      field[key] = changeSet[key];
    });

    if (hasChange) {
      field.name = name; // Just in case
      model.fields[name] = field;
      publicAPI.fireFieldChange(field);
    }
  };

  publicAPI.toggleFieldSelection = (name) => {
    model.fields[name].active = !model.fields[name].active;
    publicAPI.fireFieldChange(model.fields[name]);
  };

  publicAPI.removeAllFields = () => {
    model.fields = {};
    publicAPI.fireFieldChange();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fields: null,
  fieldsSorted: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'FieldProvider');
  CompositeClosureHelper.event(publicAPI, model, 'FieldChange');
  CompositeClosureHelper.get(publicAPI, model, ['fieldsSorted']);
  CompositeClosureHelper.set(publicAPI, model, ['fieldsSorted']);

  fieldProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
