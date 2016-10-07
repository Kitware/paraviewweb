import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import AnnotationBuilder from '../../../Common/Misc/AnnotationBuilder';
import SelectionBuilder from '../../../Common/Misc/SelectionBuilder';

// ----------------------------------------------------------------------------
// Annotation Store Provider
// ----------------------------------------------------------------------------

const dupNameRegex = /^(.+)\s\(([\d]+)\)$/;
const PROVIDER_NAME = 'AnnotationStoreProvider';

function annotationStoreProvider(publicAPI, model) {
  if (!model.annotationStore) {
    model.annotationStore = {};
  }

  publicAPI.loadStoredAnnotationsFromState = () => {
    if (publicAPI.isA('PersistentStateProvider')) {
      model.annotationStore = publicAPI.getPersistentState(PROVIDER_NAME);
      // The AnnotationBuilder and SelectionBuilder need to know where to start
      // their generation number count.
      let maxAnnoGen = 0;
      let maxSelGen = 0;
      Object.keys(model.annotationStore).forEach((annoId) => {
        const anno = model.annotationStore[annoId];
        if (anno.generation > maxAnnoGen) {
          maxAnnoGen = anno.generation;
        }
        if (anno.selection.generation > maxSelGen) {
          maxSelGen = anno.selection.generation;
        }
      });
      AnnotationBuilder.setInitialGenerationNumber(maxAnnoGen);
      SelectionBuilder.setInitialGenerationNumber(maxSelGen);
    }
  };

  publicAPI.getStoredAnnotationNames = () => {
    const val = Object.keys(model.annotationStore).map(id => model.annotationStore[id].name);
    val.sort();
    return val;
  };

  publicAPI.getNextStoredAnnotationName = (name) => {
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
      count += 1;
      newName = `${base} (${count})`;
    }

    return newName;
  };

  publicAPI.getStoredAnnotation = id => model.annotationStore[id];

  publicAPI.getStoredAnnotations = () => model.annotationStore;

  publicAPI.setStoredAnnotation = (id, annotation) => {
    const changeSet = {
      id,
      annotation,
      action: 'new',
    };
    if (model.annotationStore[id]) {
      changeSet.action = 'save';
    }
    model.annotationStore[id] = annotation;
    if (publicAPI.isA('PersistentStateProvider')) {
      publicAPI.setPersistentState(PROVIDER_NAME, model.annotationStore);
    }
    publicAPI.fireStoreAnnotationChange(changeSet);
  };

  publicAPI.updateStoredAnnotations = (updates) => {
    Object.keys(updates).forEach((annoId) => {
      model.annotationStore[annoId] = updates[annoId];
    });
    if (publicAPI.isA('PersistentStateProvider')) {
      publicAPI.setPersistentState(PROVIDER_NAME, model.annotationStore);
    }
    publicAPI.fireStoreAnnotationChange({ action: 'updates' });
  };

  publicAPI.deleteStoredAnnotation = (id) => {
    const changeSet = {
      id,
      action: 'delete',
      annotation: model.annotationStore[id],
    };
    delete model.annotationStore[id];
    if (publicAPI.isA('PersistentStateProvider')) {
      publicAPI.setPersistentState(PROVIDER_NAME, model.annotationStore);
    }
    publicAPI.fireStoreAnnotationChange(changeSet);
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
  CompositeClosureHelper.isA(publicAPI, model, PROVIDER_NAME);
  CompositeClosureHelper.event(publicAPI, model, 'StoreAnnotationChange');
  CompositeClosureHelper.set(publicAPI, model, ['defaultEmptyAnnotationName']);
  CompositeClosureHelper.get(publicAPI, model, ['defaultEmptyAnnotationName']);

  annotationStoreProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
