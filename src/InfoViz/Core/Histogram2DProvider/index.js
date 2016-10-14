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
    bins: histo2d.bins.map((bin) => {
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
    numberOfBins: histo2d.numberOfBins,
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
      const binSize = data.numberOfBins || 'default';
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
      data.bins.forEach((item) => {
        maxCount = maxCount < item.count ? item.count : maxCount;
      });
      data.maxCount = maxCount;

      const cleanedData = Object.assign({}, data, { annotationInfo: [] });
      const previousData = binStorage[data.x.name][data.y.name];

      const sameAsBefore = (JSON.stringify(cleanedData) === JSON.stringify(previousData));

      binStorage[data.x.name][data.y.name] = cleanedData;
      binStorage[data.y.name][data.x.name] = flipHistogram(cleanedData);

      return sameAsBefore;
    },
    get(storage, request, dataChanged) {
      const returnedData = {};
      let count = 0;
      let maxCount = 0;
      const { numberOfBins } = request.metadata;
      const binStorage = storage[numberOfBins];
      const rangeConsistency = {};
      request.variables.forEach((axisPair) => {
        if (!returnedData[axisPair[0]]) {
          returnedData[axisPair[0]] = {};
        }
        if (binStorage && binStorage[axisPair[0]] && binStorage[axisPair[0]][axisPair[1]]) {
          const hist2d = binStorage[axisPair[0]][axisPair[1]];

          // Look for range consistency within data
          if (hist2d.x.name && hist2d.y.name) {
            if (!rangeConsistency[hist2d.x.name]) {
              rangeConsistency[hist2d.x.name] = [];
            }
            rangeConsistency[hist2d.x.name].push(JSON.stringify(hist2d.x.extent));
            if (!rangeConsistency[hist2d.y.name]) {
              rangeConsistency[hist2d.y.name] = [];
            }
            rangeConsistency[hist2d.y.name].push(JSON.stringify(hist2d.y.extent));
          }
          count += 1;
          maxCount = maxCount < hist2d.maxCount ? hist2d.maxCount : maxCount;
          returnedData[axisPair[0]][axisPair[1]] = hist2d;
          if (request.metadata.symmetric) {
            if (!returnedData[axisPair[1]]) {
              returnedData[axisPair[1]] = {};
            }
            returnedData[axisPair[1]][axisPair[0]] = binStorage[axisPair[1]][axisPair[0]];
          }
        }
      });

      // Attach global maxCount
      returnedData.maxCount = maxCount;

      if (count === request.variables.length || (request.metadata.partial && count > 0)) {
        // Chech consistency
        let skip = false;
        Object.keys(rangeConsistency).forEach((name) => {
          const values = rangeConsistency[name];
          values.sort();
          if (values.length > 1) {
            const a = values.pop();
            const b = values.shift();
            if (a !== b) {
              skip = true;
            }
          }
        });

        return skip ? null : returnedData;
      }

      return null;
    },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
