import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Annotation Store Provider
// ----------------------------------------------------------------------------

const dupNameRegex = /^(.+)\s\(([\d]+)\)$/;

function annotationStoreProvider(publicAPI, model) {
  if (!model.annotationStore) {
    model.annotationStore = {};
  }

  publicAPI.getStoredAnnotationNames = () => {
    const val = Object.keys(model.annotationStore).map(id => model.annotationStore[id].name);
    val.sort();
    return val;
  };

  publicAPI.getNextStoredAnnotationName = name => {
    const allNames = publicAPI.getStoredAnnotationNames();
    let newName = name;
    if (!name || name.length === 0) {
      newName = model.defaultEmptyAnnotationName;
    }

    if (allNames.indexOf(newName) === -1) {
      return newName;
    }

    const [, base, countStr] = dupNameRegex.exec(newName) || [newName, newName, '0'];
    let count = Number(countStr) || 0;

    while (allNames.indexOf(newName) !== -1) {
      newName = `${base} (${++count})`;
    }

    return newName;
  };


  publicAPI.getStoredAnnotation = (id) => model.annotationStore[id];

  publicAPI.getStoredAnnotations = () => model.annotationStore;

  publicAPI.setStoredAnnotation = (id, annotation) => {
    model.annotationStore[id] = annotation;
    publicAPI.fireStoreAnnotationChange(id, annotation);
  };

  publicAPI.deleteStoredAnnotation = id => {
    delete model.annotationStore[id];
    publicAPI.fireStoreAnnotationChange(id);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // annotationStore: null,
  defaultEmptyAnnotationName: 'Empty',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'AnnotationStoreProvider');
  CompositeClosureHelper.event(publicAPI, model, 'StoreAnnotationChange');
  CompositeClosureHelper.set(publicAPI, model, ['defaultEmptyAnnotationName']);
  CompositeClosureHelper.get(publicAPI, model, ['defaultEmptyAnnotationName']);

  annotationStoreProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
