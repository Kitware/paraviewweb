import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Annotation Store Provider
// ----------------------------------------------------------------------------

function annotationStoreProvider(publicAPI, model) {
  if (!model.annotationStore) {
    model.annotationStore = {};
  }

  publicAPI.getStoreAnnotationNames = () => {
    const val = Object.keys(model.annotationStore);
    val.sort();
    return val;
  };

  publicAPI.getStoreAnnotation = (name) => model.annotationStore[name];

  publicAPI.getStoreAnnotations = () => model.annotationStore;

  publicAPI.setStoreAnnotation = (name, annotation) => {
    model.annotationStore[name] = annotation;
    publicAPI.fireStoreAnnotationChange(name, annotation);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // annotationStore: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'AnnotationStoreProvider');
  CompositeClosureHelper.event(publicAPI, model, 'StoreAnnotationChange');

  annotationStoreProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
