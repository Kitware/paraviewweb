/* global document */

import Monologue from 'monologue.js';
import style from 'PVWStyle/ComponentNative/Workbench.mcss';
import Layouts from '../../../React/Renderers/MultiLayoutRenderer/Layouts';

const CHANGE_TOPIC = 'Workbench.change';
const noOpRenderer = { resize() {}, render() {} };
const NUMBER_OF_VIEWPORTS = 4;
const LAYOUT_TO_COUNT = {
  '2x2': 4,
  '1x1': 1,
  '1x2': 2,
  '2x1': 2,
  '3xT': 3,
  '3xL': 3,
  '3xR': 3,
  '3xB': 3,
};

function applyLayout(viewport, layout) {
  const { el, renderer } = viewport;
  let styleElements = [];

  if (layout) {
    styleElements = layout.slice();
  } else {
    styleElements = [0, 0, 0, 0];
  }

  el.style.top = `${styleElements[1]}px`;
  el.style.left = `${styleElements[0]}px`;
  el.style.width = `${styleElements[2]}px`;
  el.style.height = `${styleElements[3]}px`;

  (renderer || noOpRenderer).resize();
}

export default class ComponentWorkbench {
  constructor(el, {
    useMouse: useMouse = true,
    spacing: spacing = 10,
    center: center = [0.5, 0.5],
  } = {}) {
    this.el = null;
    this.useMouse = useMouse;
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.wbArrange = {
      center,
      spacing,
    };
    this.layoutList = [];
    this.boundingRect = {};
    this.viewportList = [];
    this.activeLayout = Object.keys(Layouts)[0];
    this.layoutFn = Layouts[this.activeLayout];
    this.mouseHandlers = {
      mousedown: (event) => {
        if (this.getClickedViewport(event.clientX - this.boundingRect.left,
            event.clientY - this.boundingRect.top) === -1 && event.target === this.el) {
          this.dragging = true;
          // offset from current center to drag start.
          this.dragOffset.x = (this.boundingRect.width * this.wbArrange.center[0]) - (event.clientX - this.boundingRect.left);
          this.dragOffset.y = (this.boundingRect.height * this.wbArrange.center[1]) - (event.clientY - this.boundingRect.top);
          event.stopPropagation();
          event.preventDefault();
        }
      },
      mouseup: (event) => {
        this.dragging = false;
      },
      mousemove: (event) => {
        if (this.dragging) {
          event.stopPropagation();
          event.preventDefault();
          const centerSize = this.wbArrange.spacing;
          if (Math.abs(this.dragOffset.x) > centerSize) {
            // only drag boundary vertically
            this.wbArrange.center[1] =
              (event.clientY - this.boundingRect.top + this.dragOffset.y) / this.boundingRect.height;
          } else if (Math.abs(this.dragOffset.y) > centerSize) {
            // only drag boundary horizontally
            this.wbArrange.center[0] =
              (event.clientX - this.boundingRect.left + this.dragOffset.x) / this.boundingRect.width;
          } else {
            this.wbArrange.center = [
              (event.clientX - this.boundingRect.left + this.dragOffset.x) / this.boundingRect.width,
              (event.clientY - this.boundingRect.top + this.dragOffset.y) / this.boundingRect.height,
            ];
          }
          this.render();
        }
      },
    };

    this.initializeViewports();
    this.setContainer(el);
    this.computeContainerGeometry();
  }

  initializeViewports() {
    for (let i = 0; i < NUMBER_OF_VIEWPORTS; ++i) {
      const newElt = document.createElement('div');
      newElt.setAttribute('class', style.viewport);

      this.viewportList.push({
        el: newElt,
        renderer: null,
      });
    }
  }

  setComponents(componentDict) {
    this.componentMap = componentDict;

    Object.keys(componentDict).forEach((k) => {
      if (componentDict[k].viewport !== -1) {
        // set the viewport as well
        this.setViewport(componentDict[k].viewport, componentDict[k].component, false);
      }
    });

    this.componentMap.None = {
      component: null,
      viewport: -1,
    };

    this.triggerChange();
  }

  getClickedViewport(x, y) {
    let index = -1;
    for (let i = 0; i < this.layoutList.length; ++i) {
      const layout = this.layoutList[i];
      if (x >= layout[0] && x <= (layout[0] + layout[2]) &&
        y >= layout[1] && y <= (layout[1] + layout[3])) {
        index = i;
      }
    }
    return index;
  }

  addMouseListeners() {
    // Set up mouse handling so we can resize the individual viewports
    this.el.addEventListener('mousedown', this.mouseHandlers.mousedown);
    this.el.addEventListener('mouseup', this.mouseHandlers.mouseup);
    this.el.addEventListener('mousemove', this.mouseHandlers.mousemove);
  }

  removeMouseListeners() {
    this.el.removeEventListener('mousedown', this.mouseHandlers.mousedown);
    this.el.removeEventListener('mouseup', this.mouseHandlers.mouseup);
    this.el.removeEventListener('mousemove', this.mouseHandlers.mousemove);
  }

  render() {
    const pixelCenter = [
      this.wbArrange.center[0] * this.boundingRect.width,
      this.wbArrange.center[1] * this.boundingRect.height,
    ];
    this.layoutList = this.layoutFn(
      pixelCenter,
      this.wbArrange.spacing,
      this.wbArrange.width,
      this.wbArrange.height);

    // Now apply new styles, rendering the new workbench layout and each component
    for (let i = 0; i < NUMBER_OF_VIEWPORTS; ++i) {
      applyLayout(this.viewportList[i], this.layoutList[i]);
    }
  }

  computeContainerGeometry() {
    if (this.el) {
      this.boundingRect = this.el.getBoundingClientRect();
      this.wbArrange.width = this.boundingRect.width;
      this.wbArrange.height = this.boundingRect.height;
    }
  }

  resize() {
    if (this.el) {
      this.computeContainerGeometry();
      this.render();
    }
  }

  /* eslint-disable class-methods-use-this */
  checkIndex(idx) {
    if (idx < 0 || idx >= NUMBER_OF_VIEWPORTS) {
      throw new Error('The only available indices are in the range [0, 3]');
    }
  }

  setViewport(index, instance, shouldTriggerChange = true) {
    let count = NUMBER_OF_VIEWPORTS;
    this.checkIndex(index);

    // Find out if this instance is in another viewport
    while (count) {
      count -= 1;
      if (this.viewportList[count].renderer === instance) {
        this.viewportList[count].renderer = null;
      }
    }

    // Find out if this viewport already has something else in it
    if (this.viewportList[index].renderer !== null) {
      this.viewportList[index].renderer.setContainer(null);
      this.viewportList[index].renderer = null;
    }

    this.viewportList[index].renderer = instance;
    this.viewportList[index].el.setAttribute('class', style.viewport);
    if (instance !== null) {
      instance.setContainer(this.viewportList[index].el);
      instance.resize();
      Object.keys(this.componentMap).forEach((name) => {
        if (this.componentMap[name].component === instance && this.componentMap[name].scroll) {
          this.viewportList[index].el.setAttribute('class', style.scrollableViewport);
        }
      });
    }

    if (shouldTriggerChange) {
      this.triggerChange();
    }
  }

  setContainer(el) {
    if (this.el) {
      this.viewportList.forEach((viewport) => {
        this.el.removeChild(viewport.el);
      });
      this.removeMouseListeners();
    }

    this.el = el;
    if (this.el) {
      this.viewportList.forEach((viewport) => {
        this.el.appendChild(viewport.el);
      });
      if (this.useMouse) {
        this.addMouseListeners();
      }
      this.resize();
    }
  }

  getViewport(index) {
    this.checkIndex(index);
    return this.viewportList[index].renderer;
  }

  /* eslint-disable class-methods-use-this */
  getLayoutLabels() {
    return Object.keys(Layouts);
  }

  /*
   * Parameter 'layout' should be one of the layout keys:
   *
   * "2x2", "1x1", "1x2", "2x1", "3xT", "3xL", "3xR", "3xB"
   */
  setLayout(layout) {
    if (Layouts[layout]) {
      this.activeLayout = layout;
      this.layoutFn = Layouts[layout];
      this.resize();
      //
      this.triggerChange();
    }
  }

  getViewportMapping() {
    const viewportMapping = this.viewportList.map(viewport => viewport.renderer);
    Object.keys(this.componentMap).forEach((name) => {
      this.componentMap[name].viewport = viewportMapping.indexOf(this.componentMap[name].component);
    });
    return this.componentMap;
  }

  getLayout() {
    return this.activeLayout;
  }

  getLayoutCount() {
    return LAYOUT_TO_COUNT[this.activeLayout];
  }

  triggerChange() {
    const viewports = this.getViewportMapping();
    const layout = this.getLayout();
    const center = this.getCenter();
    const count = LAYOUT_TO_COUNT[layout];
    this.emit(CHANGE_TOPIC, { layout, viewports, center, count });
  }

  onChange(callback) {
    return this.on(CHANGE_TOPIC, callback);
  }

  setCenter(x, y) {
    this.wbArrange.center = [x, y];
    //
    this.triggerChange();
  }

  getCenter() {
    return this.wbArrange.center;
  }

  destroy() {
    this.off();
    this.setContainer(null);
    this.viewportList.forEach((viewport) => {
      viewport.el = null;
      if (viewport.renderer && viewport.renderer.destroy) {
        viewport.renderer.destroy();
        viewport.renderer = null;
      }
    });
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(ComponentWorkbench);
