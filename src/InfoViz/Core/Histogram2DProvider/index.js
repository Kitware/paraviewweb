import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Expected Data Format for Histogram2D
// ----------------------------------------------------------------------------
//
// {
//   "x": {
//     delta: 3.5,
//     extent: [0, 35],
//     name: "Name of X",
//   },
//   "y": {
//     delta: 1,
//     extent: [0, 10],
//     name: "Name of Y",
//   },
//   "bins": [
//     { x: 3.5, y: 5, count: 46 }, ...
//   ]
// }
//
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

function flipHistogram(histo2d) {
  const newHisto2d = {
    bins: histo2d.bins.map(bin => {
      const { x, y, count } = bin;
      return {
        x: y,
        y: x,
        count,
      };
    }),
    x: histo2d.y,
    y: histo2d.x,
    maxCount: histo2d.maxCount,
  };

  return newHisto2d;
}

// ----------------------------------------------------------------------------
// Histogram 2D Provider
// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'Histogram2DProvider');
  CompositeClosureHelper.dataSubscriber(publicAPI, model, 'histogram2D', {
    defaultMetadata: {
      numberOfBins: 32,
      partial: true,
    },
    set(storage, data) {
      const binSize = (data.x.extent[1] - data.x.extent[0]) / data.x.delta;
      if (!storage[binSize]) {
        storage[binSize] = {};
      }
      const binStorage = storage[binSize];
      if (!binStorage[data.x.name]) {
        binStorage[data.x.name] = {};
      }
      if (!binStorage[data.y.name]) {
        binStorage[data.y.name] = {};
      }

      // Add maxCount
      let maxCount = 0;
      data.bins.forEach(item => {
        maxCount = maxCount < item.count ? item.count : maxCount;
      });
      data.maxCount = maxCount;

      const sameAsBefore = (JSON.stringify(data) === JSON.stringify(binStorage[data.x.name][data.y.name]));

      binStorage[data.x.name][data.y.name] = data;
      binStorage[data.y.name][data.x.name] = flipHistogram(data);

      return sameAsBefore;
    },
    get(storage, request, dataChanged) {
      const returnedData = {};
      let count = 0;
      let maxCount = 0;
      const { numberOfBins } = request.metadata;
      const binStorage = storage[numberOfBins];
      request.variables.forEach(axisPair => {
        if (!returnedData[axisPair[0]]) {
          returnedData[axisPair[0]] = {};
        }
        if (binStorage[axisPair[0]] && binStorage[axisPair[0]][axisPair[1]]) {
          const hist2d = binStorage[axisPair[0]][axisPair[1]];
          count++;
          maxCount = maxCount < hist2d.maxCount ? hist2d.maxCount : maxCount;
          returnedData[axisPair[0]][axisPair[1]] = hist2d;
        }
      });

      // Attach global maxCount
      returnedData.maxCount = maxCount;

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
