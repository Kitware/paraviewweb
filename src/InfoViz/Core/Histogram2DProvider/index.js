import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

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
      if (!storage[data.x.name]) {
        storage[data.x.name] = {};
      }
      if (!storage[data.y.name]) {
        storage[data.y.name] = {};
      }

      // Add maxCount
      let maxCount = 0;
      data.bins.forEach(item => {
        maxCount = maxCount < item.count ? item.count : maxCount;
      });
      data.maxCount = maxCount;

      const sameAsBefore = (JSON.stringify(data) === JSON.stringify(storage[data.x.name][data.y.name]));

      storage[data.x.name][data.y.name] = data;
      storage[data.y.name][data.x.name] = flipHistogram(data);

      return sameAsBefore;
    },
    get(storage, request, dataChanged) {
      const returnedData = {};
      let count = 0;
      let maxCount = 0;
      request.variables.forEach(axisPair => {
        if (!returnedData[axisPair[0]]) {
          returnedData[axisPair[0]] = {};
        }
        if (storage[axisPair[0]] && storage[axisPair[0]][axisPair[1]]) {
          const hist2d = storage[axisPair[0]][axisPair[1]];
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
