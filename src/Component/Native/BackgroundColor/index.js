import style from 'PVWStyle/ComponentNative/BackgroundColor.mcss';
import htmlContent from './body.html';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

function backgroundColorComponent(publicAPI, model) {
  publicAPI.resize = () => {
    // When using this component as a template, respond
    // to resize events by updating the DOM to match.
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
      }
    }

    model.container = el;

    if (model.container) {
      // Create placeholder
      model.container.innerHTML = htmlContent;

      // Apply style
      const colorEle = model.container.querySelector('.bg-color-container');
      colorEle.classList.add(style.bgColorContainer);
      colorEle.style.backgroundColor = model.color;
    }
  };

  publicAPI.setColor = (colorSpec) => {
    let color = colorSpec;
    if (typeof colorSpec !== 'string' || colorSpec === '') {
      color = 'inherit';
    }
    model.color = color;
    if (model.container) {
      model.container.querySelector('.bg-color-container').style.backgroundColor = model.color;
    }
  };

  // When removing this component, clean up its container and call the parent
  // object's destroy method:
  publicAPI.destroy = CompositeClosureHelper.chain(() => {
    publicAPI.setContainer(null);
  }, publicAPI.destroy);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  color: 'inherit',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['color', 'container']);

  backgroundColorComponent(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
