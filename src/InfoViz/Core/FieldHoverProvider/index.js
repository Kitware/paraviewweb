import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Field Hover Provider
//
// Track which field (aka variable aka dataset column) the user is
// examining (as indicated by touch/mouse events).
//
// The state object contains:
// + a **highlight** entry that is a dictionary mapping field names
//   to a truthy value. Do not put keys into the dictionary unless
//   you want them to be highlighted.
// + a **subject** entry that is either null or the name of a field.
// + a **disposition** entry that is a string: either
//   'preliminary' or 'final'. This indicates whether the interaction
//   producing the hover events is ongoing or complete.
// ----------------------------------------------------------------------------

function fieldHoverProvider(publicAPI, model) {
  if (!model.fieldHoverState) {
    model.fieldHoverState = {
      state: {
        highlight: {},
        subject: null,
        disposition: 'final',
      },
    };
  }

  /// Set the hover state and invoke callbacks on all subscribers.
  publicAPI.setFieldHoverState = (fieldHoverState) => {
    model.fieldHoverState = fieldHoverState;
    publicAPI.fireHoverFieldChange(model.fieldHoverState);
  };

  /// Return a **copy** of the current hover state (for modification and update).
  publicAPI.getFieldHoverState = () => JSON.parse(JSON.stringify(model.fieldHoverState));
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
