import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Histogram Bin Hover Provider
// ----------------------------------------------------------------------------

function histogramBinHoverProvider(publicAPI, model) {
  if (!model.hoverState) {
    model.hoverState = {};
  }

  publicAPI.setHoverState = (hoverState) => {
    model.hoverState = hoverState;
    publicAPI.fireHoverBinChange(model.hoverState);
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
  CompositeClosureHelper.isA(publicAPI, model, 'HistogramBinHoverProvider');
  CompositeClosureHelper.event(publicAPI, model, 'HoverBinChange');

  histogramBinHoverProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
