/* global document, d3, window */
import 'normalize.css';

import    HyperbolicEdgeBundles from '../../../../InfoViz/Native/HyperbolicEdgeBundles';
import            FieldSelector from '../../../../InfoViz/Native/FieldSelector';
import     FieldRelationDiagram from '../../../../InfoViz/Native/FieldRelationDiagram';
import       FieldHoverProvider from '../../../../InfoViz/Core/FieldHoverProvider';
import FieldInformationProvider from '../../../../InfoViz/Core/FieldInformationProvider';
import            FieldProvider from '../../../../InfoViz/Core/FieldProvider';
import           LegendProvider from '../../../../InfoViz/Core/LegendProvider';
import   CompositeClosureHelper from '../../../../Common/Core/CompositeClosureHelper';
import                Workbench from '../../../../Component/Native/Workbench';
import              DataManager from '../../../../IO/Core/DataManager';


import { debounce } from '../../../../Common/Misc/Debounce';

import dataModel from '../../HistogramSelector/example/state.json';

const container = document.querySelector('.content');
container.style.height = '100vh';
container.style.width = '100vw';
d3.select('body').style('overflow', 'hidden'); // Safari otherwise intercepts wheel events

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  FieldProvider.extend(publicAPI, model, initialValues);
  FieldHoverProvider.extend(publicAPI, model, initialValues);
  FieldInformationProvider.extend(publicAPI, model, initialValues);
  LegendProvider.extend(publicAPI, model, initialValues);
})(dataModel);
provider.setFieldsSorted(true);
provider.getFieldNames().forEach((name) => {
  provider.addLegendEntry(name);
});
provider.assignLegend(['colors', 'shapes']);

// Fetch data (which can be too large for webpack) using a DataManager:
const dataManager = new DataManager();
const url = '/paraviewweb/data/dummy/minfo.nba.withCorrelations.json';
dataManager.on(url, (data, envelope) => {
  console.log('loaded data ', data, ' from ', url);
  const minfo = data.data.mutualInformation;
  const fieldKeys = Object.keys(data.data.fieldMapping);
  const vars = new Array(fieldKeys.length);
  fieldKeys.forEach((key) => {
    vars[data.data.fieldMapping[key].id] = data.data.fieldMapping[key];
    // We assigned legend entries above, but only for fields listed by the FieldProvider.
    // Our demo hacks more variables into FieldInformation, so add legend entries for those, too.
    // TODO: Be consistent with FieldProvider.
    if (!provider.getLegend(key)) {
      provider.addLegendEntry(key);
    }
  });
  provider.setFieldInformation({
    fieldMapping: vars,
    mutualInformation: minfo,
    smiTheta: data.data.theta,
    taylorPearson: data.data.taylorPearson,
    taylorTheta: data.data.taylorTheta,
    taylorR: data.data.taylorStdDev,
  });
});
dataManager.fetchURL(url, 'json');

const hyperbolicView = HyperbolicEdgeBundles.newInstance({ provider });
const fieldSMI = FieldRelationDiagram.newInstance({ provider, diagramType: 'smi' });
const fieldTaylor = FieldRelationDiagram.newInstance({ provider, diagramType: 'taylor' });
const fieldSelector = FieldSelector.newInstance({ provider, displaySearch: true, fieldShowHistogram: false });
let fieldInfo = null;
let sortByVar = null;

// fieldSelector can be sorted using any numeric array
provider.subscribeToFieldInformation((info) => {
  fieldInfo = info;
});
provider.onHoverFieldChange((hover) => {
  // console.log(hover.state.disposition, hover.state.subject, hover.state.highlight);
  let sortOrder = null;
  if (hover.state.subject) {
    console.log('Reorder by mutual information to ', hover.state.subject);
    sortOrder = fieldInfo.fieldMapping.reduce(
            (varId, entry) => (entry.name === hover.state.subject ? entry.id : varId),
            null);
  }
  if (sortByVar !== sortOrder && sortOrder !== null) {
    sortByVar = sortOrder;
    fieldSelector.setSortArray(sortByVar, fieldInfo.mutualInformation[sortByVar]);
  } else if (hover.state.disposition === 'final' && sortOrder === null) {
    // reset to alphabetical, use 'up' to reverse
    fieldSelector.setSortArray(null, null, 'down');
    sortByVar = null;
  }
});

const viewports = {
  HyperbolicEdgeBundles: {
    component: hyperbolicView,
    viewport: 0,
  },
  FieldSelector: {
    component: fieldSelector,
    viewport: 1,
  },
  TaylorDiagram: {
    component: fieldSMI,
    viewport: 2,
  },
  SMIDiagram: {
    component: fieldTaylor,
    viewport: 3,
  },
};

const workbench = new Workbench();
workbench.setComponents(viewports);
workbench.setLayout('2x2');

workbench.setContainer(container);

// Create a debounced window resize handler
const resizeHandler = debounce(() => {
  workbench.resize();
}, 50);

// Register window resize handler so workbench redraws when browser is resized
window.onresize = resizeHandler;

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.hyperbolicView = hyperbolicView;
global.fieldSelector = fieldSelector;
global.fieldSMI = fieldSMI;
global.fieldTaylor = fieldTaylor;
