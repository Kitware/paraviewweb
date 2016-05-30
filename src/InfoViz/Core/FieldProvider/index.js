import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Field Provider
// ----------------------------------------------------------------------------

function fieldProvider(publicAPI, model) {
  if (!model.fields) {
    model.fields = {};
  }

  publicAPI.listFields = () => Object.keys(model.fields);

  publicAPI.getActiveFields = () => Object.keys(model.fields).filter(name => model.fields[name].active);

  publicAPI.addField = (name, range = [0, 1], active = false) => {
    model.fields[name] = { range, active };
  };

  publicAPI.activateField = (name, active = true) => {
    model.fields[name].active = active;
  };

  publicAPI.removeAllFields = () => {
    model.fields = {};
  };

  publicAPI.getFieldRange = name => model.fields[name].range;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fields: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'FieldProvider');

  fieldProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
