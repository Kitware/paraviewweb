import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Histogram 1D Provider
// ----------------------------------------------------------------------------

/*
  Data Format: Below is an example of the expected histogram 1D data format

  {
    "name": "points per game",
    "min": 0,
    "max": 32,
    "counts": [10, 4, 0, 0, 13, ... ]
  }
*/

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram1DProvider');
  CompositeClosureHelper.dataSubscriber(publicAPI, model, 'histogram1D', {
    defaultMetadata: {
      numberOfBins: 32,
      partial: true,
    },
    set(storage, data) {
      const numberOfBins = data.counts.length;
      if (!storage[numberOfBins]) {
        storage[numberOfBins] = {};
      }
      const binStorage = storage[numberOfBins];
      const sameAsBefore = (JSON.stringify(data) === JSON.stringify(binStorage[data.name]));
      binStorage[data.name] = data;
      return sameAsBefore;
    },
    get(storage, request, dataChanged) {
      const { numberOfBins } = request.metadata;
      const binStorage = storage[numberOfBins];
      const returnedData = {};
      let count = 0;
      request.variables.forEach(name => {
        if (binStorage && binStorage[name]) {
          count++;
          returnedData[name] = binStorage[name];
        }
      });
      if (count === request.variables.length || (request.metadata.partial && count > 0)) {
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
