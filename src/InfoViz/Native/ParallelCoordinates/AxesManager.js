import { dataToScreen } from '.';
import Axis from './Axis';

// ----------------------------------------------------------------------------

export default class AxesManager {
  constructor() {
    this.axes = [];
    this.listeners = [];
  }

  clearAxes() {
    this.axes = [];
  }

  updateAxes(axisList) {
    if (this.axes.length === 0) {
      axisList.forEach(entry => {
        this.addAxis(new Axis(entry.name, entry.range));
      });
    } else {
      const targetList = [];
      const toAdd = [];

      // index axes
      const nameToAxisMap = {};
      this.axes.forEach(axis => {
        nameToAxisMap[axis.name] = axis;
      });

      axisList.forEach(entry => {
        targetList.push(entry.name);
        if (!nameToAxisMap[entry.name]) {
          toAdd.push(new Axis(entry.name, entry.range));
        }
      });

      // Remove unwanted axis while keeping the previous order
      this.axes = this.axes.filter(axis => targetList.indexOf(axis.name) !== -1).concat(toAdd);
    }
    // Update index
    this.axes.forEach((item, idx) => {
      item.idx = idx;
    });
  }

  addAxis(axis) {
    axis.idx = this.axes.length;
    this.axes.push(axis);
  }

  getAxis(index) {
    return this.axes[index];
  }

  getAxisByName(name) {
    return this.axes.filter(axis => axis.name === name)[0];
  }

  canRender() {
    return this.axes.length > 1;
  }

  getNumberOf2DHistogram() {
    return this.axes.length - 1;
  }

  getNumberOfAxes() {
    return this.axes.length;
  }

  getAxesNames() {
    return this.axes.map(axis => axis.name);
  }

  getAxesPairs() {
    const axesPairs = [];
    for (let i = 1; i < this.axes.length; i++) {
      axesPairs.push([this.axes[i - 1].name, this.axes[i].name]);
    }
    return axesPairs;
  }

  resetSelections(selections = {}) {
    this.clearSelection(true);

    // index axes
    const nameToAxisMap = {};
    this.axes.forEach(axis => {
      nameToAxisMap[axis.name] = axis;
    });

    // Update selections
    Object.keys(selections).forEach(axisName => {
      nameToAxisMap[axisName].selections = selections[axisName];
    });
    this.triggerSelectionChange();
  }

  addSelection(axisIdx, start, end) {
    this.axes[axisIdx].addSelection(start, end);
    this.triggerSelectionChange();
  }

  updateSelection(axisIdx, selectionIdx, min, max) {
    this.axes[axisIdx].updateSelection(selectionIdx, min, max);
    this.triggerSelectionChange();
  }

  clearSelection(axisIdx) {
    this.axes[axisIdx].clearSelection();
    this.triggerSelectionChange();
  }

  getAxisCenter(index, width) {
    return index * width / this.axes.length;
  }

  toggleOrientation(index) {
    this.axes[index].toggleOrientation();
  }

  swapAxes(aIdx, bIdx) {
    if (!this.axes[aIdx] || !this.axes[bIdx]) {
      return;
    }
    const a = this.axes[aIdx];
    const b = this.axes[bIdx];
    this.axes[aIdx] = b;
    this.axes[bIdx] = a;
    a.idx = bIdx;
    b.idx = aIdx;
  }

  hasSelection() {
    return this.axes.filter(axis => axis.hasSelection()).length > 0;
  }

  clearAllSelections(silence) {
    this.axes.forEach(axis => axis.clearSelection());
    if (!silence) {
      this.triggerSelectionChange();
    }
  }

  onSelectionChange(callback) {
    const listenerId = this.listeners.length;
    const unsubscribe = () => {
      this.listeners[listenerId] = null;
    };
    this.listeners.push(callback);
    return { unsubscribe };
  }

  triggerSelectionChange() {
    const selection = {};
    if (this.hasSelection) {
      selection.type = 'range';
      selection.ranges = {};
      this.axes.forEach(axis => {
        if (axis.hasSelection()) {
          selection.ranges[axis.name] = [].concat(axis.selections);
        }
      });
    } else {
      selection.type = 'empty';
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      if (listener) {
        listener(selection);
      }
    });
  }

  getPredicates() {
    let count = this.axes.length;
    const predicates = [];
    while (count--) {
      const axisPredicates = this.axis[count].getPredicates();
      if (axisPredicates) {
        predicates.push('&&');
        predicates.push(axisPredicates);
      }
    }
    predicates[0] = { type: 'L&' };
    // Flip array to have the proper order
    return predicates.reverse();
  }

  getSelections() {
    const selections = {};
    this.axes.forEach(axis => {
      if (axis.hasSelection()) {
        selections[axis.name] = [].concat(axis.selections);
      }
    });
    return selections;
  }

  extractSelections(model) {
    const selections = [];
    if (this.hasSelection()) {
      this.axes.forEach((axis, index) => {
        const screenX = this.getAxisCenter(index, model.canvasArea.width) + model.borderOffsetLeft;
        axis.selections.forEach((selection, selectionIndex) => {
          selections.push({
            index,
            selectionIndex,
            screenX,
            screenRangeY: [
              dataToScreen(model, selection[0], axis),
              dataToScreen(model, selection[1], axis),
            ],
          });
        });
      });
    }
    return selections;
  }

  extractAxesControl(model) {
    const controlsDataModel = [];
    this.axes.forEach((axis, index) => {
      controlsDataModel.push({
        orient: axis.isUpsideDown(),
        centerX: this.getAxisCenter(index, model.canvasArea.width) + model.borderOffsetLeft,
        centerY: model.canvasArea.height - model.borderOffsetBottom + 30, // FIXME what is 30?
      });
    });

    // Tag first/last axis
    controlsDataModel[0].pos = -1;
    controlsDataModel[controlsDataModel.length - 1].pos = 1;

    return controlsDataModel;
  }

  extractLabels(model) {
    const labelModel = [];

    this.axes.forEach((axis, index) => {
      labelModel.push({
        name: axis.name,
        centerX: this.getAxisCenter(index, model.canvasArea.width) + model.borderOffsetLeft,
        annotated: axis.hasSelection(),
        align: 'middle',
      });
    });

    // Tag first/last axis
    labelModel[0].align = 'start';
    labelModel[labelModel.length - 1].align = 'end';

    return labelModel;
  }

  extractAxesCenters(model) {
    const axesCenters = [];
    this.axes.forEach((axis, index) => {
      axesCenters.push(this.getAxisCenter(index, model.canvasArea.width) + model.borderOffsetLeft);
    });
    return axesCenters;
  }
}
