// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

let generation = 0;

// ----------------------------------------------------------------------------
// Public builder method
// ----------------------------------------------------------------------------

export function annotation(selection, score, weight = 1, rationale = '') {
  generation++;
  return {
    generation,
    selection,
    score,
    weight,
    rationale,
  };
}

// ----------------------------------------------------------------------------

export function update(annotationObject, changeSet) {
  const updatedAnnotation = Object.assign({}, annotationObject, changeSet);

  let changeDetected = false;
  Object.keys(updatedAnnotation).forEach(key => {
    if (updatedAnnotation[key] !== annotationObject[key]) {
      changeDetected = true;
    }
  });

  if (changeDetected) {
    generation++;
    updatedAnnotation.generation = generation;
  }

  return updatedAnnotation;
}

// ----------------------------------------------------------------------------
// Exposed object
// ----------------------------------------------------------------------------

export default {
  annotation,
  update,
};
