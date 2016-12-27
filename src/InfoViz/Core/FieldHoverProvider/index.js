import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Field Hover Provider
//
// Track which field (aka variable aka dataset column) the user is
// examining (as indicated by touch/mouse events).
// ----------------------------------------------------------------------------

function fieldHoverProvider(publicAPI, model) {
  if (!model.fieldHoverState) {
    model.fieldHoverState = {};
  }

  publicAPI.setFieldHoverState = (fieldHoverState) => {
    model.fieldHoverState = fieldHoverState;
    publicAPI.fireHoverFieldChange(model.fieldHoverState);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'FieldHoverProvider');
  CompositeClosureHelper.event(publicAPI, model, 'HoverFieldChange');

  fieldHoverProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
