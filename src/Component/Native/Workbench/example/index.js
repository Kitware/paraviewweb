import 'normalize.css';

import Workbench from '..';
import ToggleControl from '../../ToggleControl';
import BGColor from '../../BackgroundColor';
import Spacer from '../../Spacer';
import Composite from '../../Composite';
import ReactAdapter from '../../../React/ReactAdapter';
import WorkbenchController from '../../../React/WorkbenchController';

import { debounce } from '../../../../Common/Misc/Debounce';


const container = document.querySelector('.content');
container.style.height = '100vh';
container.style.width = '100vw';

const green = new BGColor('green');
const red = new BGColor('red');
const blue = new BGColor('blue');
const pink = new BGColor('pink');
const gray = new BGColor('gray');

// const toggleView = new ToggleControl(green, red);

const viewports = {
  Gray: {
    component: gray,
    viewport: 2,
  },
  // ToggleView: {
  //   component: toggleView,
  //   viewport: 0,
  // },
  Green: {
    component: green,
    viewport: 0,
  },
  Red: {
    component: red,
    viewport: -1,
  },
  Blue: {
    component: blue,
    viewport: 1,
  },
  Pink: {
    component: pink,
    viewport: 3,
  },
};

const workbench = new Workbench();
workbench.setComponents(viewports);
workbench.setLayout('2x2');

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

