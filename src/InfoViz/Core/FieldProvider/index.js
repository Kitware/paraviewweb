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
    publicAPI.fireFieldsChange();
  };

  publicAPI.getField = (name) => model.fields[name];

  publicAPI.activateField = (name, active = true) => {
    if (model.fields[name].active !== active) {
      model.fields[name].active = active;
      publicAPI.fireFieldsChange();
    }
  };

  publicAPI.toggleFieldSelection = name => {
    model.fields[name].active = !model.fields[name].active;
    publicAPI.fireFieldsChange();
  };

  publicAPI.removeAllFields = () => {
    model.fields = {};
    publicAPI.fireFieldsChange();
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
  CompositeClosureHelper.event(publicAPI, model, 'FieldsChange');

  fieldProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
