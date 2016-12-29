import 'normalize.css';

import    HyperbolicEdgeBundles from '../../../../InfoViz/Native/HyperbolicEdgeBundles';
import            FieldSelector from '../../../../InfoViz/Native/FieldSelector';
import       FieldHoverProvider from '../../../../InfoViz/Core/FieldHoverProvider';
import FieldInformationProvider from '../../../../InfoViz/Core/FieldInformationProvider';
import            FieldProvider from '../../../../InfoViz/Core/FieldProvider';
import           LegendProvider from '../../../../InfoViz/Core/LegendProvider';
import   CompositeClosureHelper from '../../../../Common/Core/CompositeClosureHelper';
import                Workbench from '../../../../Component/Native/Workbench';
import          BackgroundColor from '../../../../Component/Native/BackgroundColor';
import            ToggleControl from '../../../../Component/Native/ToggleControl';
import                   Spacer from '../../../../Component/Native/Spacer';
import                Composite from '../../../../Component/Native/Composite';
import             ReactAdapter from '../../../../Component/React/ReactAdapter';
import      WorkbenchController from '../../../../Component/React/WorkbenchController';
import              DataManager from '../../../../IO/Core/DataManager';

import { debounce } from '../../../../Common/Misc/Debounce';

import dataModel from './state.json';

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
provider.getFieldNames().forEach(name => {
  provider.addLegendEntry(name);
});
provider.assignLegend(['colors', 'shapes']);

// Fetch data (which can be too large for webpack) using a DataManager:
const dataManager = new DataManager();
const url = '/paraviewweb/data/dummy/minfo.200.json';
dataManager.on(url, (data, envelope) => {
  console.log('loaded data from ', url);
  const minfo = data.data.mutualInformation;
  const fieldKeys = Object.keys(data.data.fieldMapping);
  const vars = new Array(fieldKeys.length);
  fieldKeys.forEach(key => { vars[data.data.fieldMapping[key].id] = data.data.fieldMapping[key]; });
  provider.setFieldInformation({ fieldMapping: vars, mutualInformation: minfo });
});
dataManager.fetchURL(url, 'json');

const green = BackgroundColor.newInstance({ color:'green' });
const   red = BackgroundColor.newInstance({ color:'red' });
const  blue = BackgroundColor.newInstance({ color:'blue' });
const  pink = BackgroundColor.newInstance({ color:'pink' });
const  gray = BackgroundColor.newInstance({ color:'gray' });

const hyperbolicView = HyperbolicEdgeBundles.newInstance({ provider });
const fieldSelector = FieldSelector.newInstance({ provider });

const viewports = {
  Gray: {
    component: gray,
    viewport: 2,
  },
  HyperbolicEdgeBundles: {
    component: hyperbolicView,
    viewport: 0,
  },
  Green: {
    component: green,
    viewport: -1,
  },
  Red: {
    component: red,
    viewport: -1,
  },
  FieldSelector: {
    component: fieldSelector,
    viewport: 1,
  },
  Blue: {
    component: blue,
    viewport: -1,
  },
  Pink: {
    component: pink,
    viewport: 3,
  },
};

const workbench = new Workbench();
workbench.setComponents(viewports);
workbench.setLayout('2x1');

const props = {
  onLayoutChange(layout) {
    workbench.setLayout(layout);
  },
  onViewportChange(index, instance) {
    workbench.setViewport(index, instance);
  },
  activeLayout: workbench.getLayout(),
  viewports: workbench.getViewportMapping(),
  count: 4,
};

const controlPanel = new ReactAdapter(WorkbenchController, props);
const shiftedWorkbench = new Composite();
shiftedWorkbench.addViewport(new Spacer(), false);
shiftedWorkbench.addViewport(workbench);
const mainComponent = new ToggleControl(shiftedWorkbench, controlPanel, 280);
mainComponent.setContainer(container);

workbench.onChange(model => {
  props.activeLayout = model.layout;
  props.viewports = model.viewports;
  props.count = model.count;
  controlPanel.render();
});

// Create a debounced window resize handler
const resizeHandler = debounce(() => {
  mainComponent.resize();
}, 50);

// Register window resize handler so workbench redraws when browser is resized
window.onresize = resizeHandler;

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.hyperbolicView = hyperbolicView;
