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
    y: histo2d.x };

  return newHisto2d;
}

// ----------------------------------------------------------------------------
// Selection Provider
// ----------------------------------------------------------------------------

function selectionProvider(publicAPI, model, fetchHelper) {
  // Private members
  const ready = publicAPI.fireSelectionHistogram2DReady;
  delete publicAPI.fireSelectionHistogram2DReady;

  // Protected members
  if (!model.histogram2DSelectionData) {
    model.histogram2DSelectionData = {};
  }

  // Data access
  publicAPI.setSelectionHistogram2DNumberOfBins = bin => {
    if (model.selectionHistogram2DNumberOfBins !== bin) {
      model.histogram2DSelectionData = {};
      model.selectionHistogram2DNumberOfBins = bin;
    }
  };

  // Return true if data is available
  publicAPI.loadSelectionHistogram2D = (axisA, axisB) => {
    if (model.histogram2DSelectionData[axisA] && model.histogram2DSelectionData[axisA][axisB]) {
      if (model.histogram2DSelectionData[axisA][axisB].pending) {
        return false;
      }
      return true;
    }
    if (model.histogram2DSelectionData[axisB] && model.histogram2DSelectionData[axisB][axisA]
      && !model.histogram2DSelectionData[axisB][axisA].pending) {
      if (!model.histogram2DSelectionData[axisA]) {
        model.histogram2DSelectionData[axisA] = {};
      }
      model.histogram2DSelectionData[axisA][axisB] = flipHistogram(model.histogram2DSelectionData[axisB][axisA]);
      return true;
    }

    if (!model.histogram2DSelectionData[axisA]) {
      model.histogram2DSelectionData[axisA] = {};
    }
    model.histogram2DSelectionData[axisA][axisB] = { pending: true };

    // Request data if possible
    fetchHelper.addRequest([axisA, axisB]);

    return false;
  };

  publicAPI.getSelectionHistogram2D = (axisA, axisB) => {
    if (model.histogram2DSelectionData[axisA] && model.histogram2DSelectionData[axisA][axisB]) {
      return model.histogram2DSelectionData[axisA][axisB];
    }
    return null;
  };

  publicAPI.setSelectionHistogram2D = (axisA, axisB, data) => {
    if (!model.histogram2DSelectionData[axisA]) {
      model.histogram2DSelectionData[axisA] = {};
    }
    if (!model.histogram2DSelectionData[axisB]) {
      model.histogram2DSelectionData[axisB] = {};
    }
    model.histogram2DSelectionData[axisA][axisB] = data;
    model.histogram2DSelectionData[axisB][axisA] = flipHistogram(data);

    setImmediate(() => {
      ready(axisA, axisB, data);
    });
  };

  publicAPI.getSelectionMaxCount = (axisA, axisB) => {
    if (model.histogram2DSelectionData[axisA] &&
      model.histogram2DSelectionData[axisA][axisB] &&
      model.histogram2DSelectionData[axisA][axisB].bins) {
      if (!model.histogram2DSelectionData[axisA][axisB].maxCount) {
        let count = 0;
        model.histogram2DSelectionData[axisA][axisB].bins.forEach(item => {
          count = count < item.count ? item.count : count;
        });
        model.histogram2DSelectionData[axisA][axisB].maxCount = count;
      }
      return model.histogram2DSelectionData[axisA][axisB].maxCount;
    }
    return 0;
  };

  publicAPI.getSelectionMaxCounts = listOfAxisPair => listOfAxisPair.map(args => publicAPI.getSelectionMaxCount(args[0], args[1]));
  publicAPI.getSelectionMaxOfMaxCounts = listOfAxisPair => Math.max.apply(null, publicAPI.getSelectionMaxCounts(listOfAxisPair));

  // --------------------------------

  publicAPI.resetSelectionHistogram2D = (selection) => {
    fetchHelper.clearRequests();
    model.histogram2DSelectionData = {};
    model.selection = selection;
    publicAPI.fireSelectionChange(selection);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // selection: null,
  // histogram2DSelectionData: null,
  selectionHistogram2DNumberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'SelectionProvider');
  CompositeClosureHelper.get(publicAPI, model, ['selectionHistogram2DNumberOfBins', 'selection']);
  CompositeClosureHelper.event(publicAPI, model, 'selectionChange');
  CompositeClosureHelper.event(publicAPI, model, 'SelectionHistogram2DReady');
  const fetchHelper = CompositeClosureHelper.fetch(publicAPI, model, 'SelectionHistogram2D');

  selectionProvider(publicAPI, model, fetchHelper);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
