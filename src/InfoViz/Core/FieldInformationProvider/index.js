import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Field Information Provider
// ----------------------------------------------------------------------------

/*
  Data Format: Below is an example of the expected fieldn information data format

  {
    "fieldMapping": { "points per game": { id: 0 }, "minutes": { id: 1 }, ... }
    "mutualInformation": [[4.63, 2.1, 1.02, 0.44, ...], [2.1, 3.97, 0.28, ...], ...],
    "variationOfInformation": [[0, 0.03, 0.77, 1.2, ...], [0.03, 0, 2.6, ...], ...],
  }

  mutualInformation and variationOfInformation are symmetric square matrices
  with one row/column for each field.

  fieldMapping provides a row/column number for each field.
*/

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'FieldInformationProvider');
  CompositeClosureHelper.dataSubscriber(publicAPI, model, 'fieldInformation', {
    defaultMetadata: {
      onlyStaticFields: true,
    },
    set(storage, data) {
      let unchanged = true;
      if (!('fieldMapping' in storage)) {
        storage.fieldMapping = [];
        unchanged = false;
      }
      Object.keys(data.fieldMapping).forEach((name) => {
        if (name in storage.fieldMapping) {
          if (storage.fieldMapping[name].id === data.fieldMapping[name].id) {
            storage.fieldMapping[name] =
              Object.assign(storage.fieldMapping[name], data.fieldMapping[name]);
          } else {
            console.log('TODO: Implement renumbering of existing row/col');
            throw `Field ${name} already at ${storage.fieldMapping[name].id}; ` +
              `not moving to ${data.fieldMapping[name].id}.`;
          }
        } else {
          unchanged = false;
          storage.fieldMapping[name] =
            Object.assign({}, data.fieldMapping[name]);
        }
      });
      if ('mutualInformation' in data) {
        if (!('mutualInformation' in storage)) {
          storage.mutualInformation = data.mutualInformation;
        } else {
          console.log('TODO: Implement merge of mutual information');
          throw 'Mutual information present in both state and data. Not handled yet.';
        }
      }
      if ('variationOfInformation' in data) {
        if (!('variationOfInformation' in storage)) {
          storage.variationOfInformation = data.variationOfInformation;
        } else {
          console.log('TODO: Implement merge of variation of information');
          throw 'variation of information present in both state and data. Not handled yet.';
        }
      }
      ['smiTheta', 'taylorPearson', 'taylorTheta', 'taylorR', 'entropy'].forEach((key) => {
        if (key in data) {
          if (!(key in storage)) {
            storage[key] = data[key];
          } else {
            console.log(`TODO: Implement merge of ${key}`);
            throw `${key} present in both state and data. Not handled yet.`;
          }
        }
      });

      return unchanged;
    },
    get(storage, request, dataChanged) {
      const returnedData = Object.assign({}, storage);
      if (['fieldMapping', 'mutualInformation'].reduce((valid, key) => valid && key in storage, true)) {
        return returnedData;
      }
      return null;
    },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
