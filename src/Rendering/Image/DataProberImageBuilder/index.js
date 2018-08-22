/* global Image */

import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

import '../../../React/CollapsibleControls/CollapsibleControlFactory/LookupTableManagerWidget';
import '../../../React/CollapsibleControls/CollapsibleControlFactory/ProbeControl';
import '../../../React/CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const PROBE_LINE_READY_TOPIC = 'ProbeImageBuilder.chart.data.ready';
const PROBE_CHANGE_TOPIC = 'ProbeImageBuilder.probe.location.change';
const CROSSHAIR_VISIBILITY_CHANGE_TOPIC =
  'ProbeImageBuilder.crosshair.visibility.change';
const RENDER_METHOD_CHANGE_TOPIC = 'ProbeImageBuilder.render.change';
const dataMapping = {
  XY: {
    idx: [0, 1, 2],
    hasChange: (probe, x, y, z) => probe[2] !== z,
    updateProbeValue: (self, x, y, z) => {
      const width = self.metadata.dimensions[0];
      const idx = x + y * width;
      const array = self.scalars[self.getField()];

      if (array) {
        self.probeValue = array[idx];
      }
    },
  },
  XZ: {
    idx: [0, 2, 1],
    hasChange: (probe, x, y, z) => probe[1] !== y,
    updateProbeValue: (self, x, y, z) => {
      const width = self.metadata.dimensions[0];
      const idx = x + z * width;
      const array = self.scalars[self.getField()];

      if (array) {
        self.probeValue = array[idx];
      }
    },
  },
  ZY: {
    idx: [2, 1, 0],
    hasChange: (probe, x, y, z) => probe[0] !== x,
    updateProbeValue: (self, x, y, z) => {
      const width = self.metadata.dimensions[2];
      const idx = z + y * width;
      const array = self.scalars[self.getField()];

      if (array) {
        self.probeValue = array[idx];
      }
    },
  },
};

export default class DataProberImageBuilder extends AbstractImageBuilder {
  // ------------------------------------------------------------------------

  constructor(queryDataModel, lookupTableManager) {
    super({
      queryDataModel,
      lookupTableManager,
    });

    this.metadata =
      queryDataModel.originalData.InSituDataProber ||
      queryDataModel.originalData.DataProber;
    this.fieldIndex = 0;
    this.renderMethodMutable = true;
    this.renderMethod = 'XY';
    this.lastImageStack = null;
    this.workImage = new Image();
    this.triggerProbeLines = false;
    this.broadcastCrossHair = true;
    this.scalars = {};
    this.probeValue = 0;
    this.probeXYZ = [
      Math.floor(this.metadata.dimensions[0] / 2),
      Math.floor(this.metadata.dimensions[1] / 2),
      Math.floor(this.metadata.dimensions[2] / 2),
    ];
    this.setField(this.metadata.fields[this.fieldIndex]);
    this.pushMethod = 'pushToFrontAsBuffer';

    // Update LookupTableManager with data range
    this.lookupTableManager.addFields(
      this.metadata.ranges,
      this.queryDataModel.originalData.LookupTables
    );
    this.registerSubscription(
      this.lookupTableManager.onActiveLookupTableChange((data, envelope) => {
        if (this.getField() !== data) {
          this.setField(data);
          this.update();
        }
      })
    );

    let maxSize = 0;
    for (let i = 0; i < 3; ++i) {
      const currentSize = this.metadata.dimensions[i];
      maxSize = maxSize < currentSize ? currentSize : maxSize;
    }
    this.bgCanvas = new CanvasOffscreenBuffer(maxSize, maxSize);
    this.registerObjectToFree(this.bgCanvas);

    this.fgCanvas = null;

    // Handle events
    this.registerSubscription(
      queryDataModel.onDataChange((data, envelope) => {
        this.lastImageStack = data;

        const renderCallback = () => {
          this.render();
        };
        let canRenderNow = true;

        Object.keys(data).forEach((key) => {
          const img = data[key].image;
          img.addEventListener('load', renderCallback);
          canRenderNow = canRenderNow && img.complete;
        });

        if (canRenderNow) {
          this.render();
        }
      })
    );

    this.registerSubscription(
      this.lookupTableManager.onChange((data, envelope) => {
        this.update();
      })
    );

    // Event handler
    const self = this;
    this.mouseListener = {
      click: (event, envelope) => {
        if (!event.activeArea) {
          return false;
        }
        const probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]];
        const axisMap = dataMapping[self.renderMethod].idx;
        const dimensions = self.metadata.dimensions;
        const activeArea = event.activeArea;

        let xRatio = (event.relative.x - activeArea[0]) / activeArea[2];
        let yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        if (event.modifier) {
          return false;
        }

        // Clamp bounds
        xRatio = xRatio < 0 ? 0 : xRatio > 1 ? 1 : xRatio;
        yRatio = yRatio < 0 ? 0 : yRatio > 1 ? 1 : yRatio;

        const xPos = Math.floor(xRatio * dimensions[axisMap[0]]);
        const yPos = Math.floor(yRatio * dimensions[axisMap[1]]);

        probe[axisMap[0]] = xPos;
        probe[axisMap[1]] = yPos;

        self.setProbe(probe[0], probe[1], probe[2]);

        return true;
      },
      drag: (event, envelope) => {
        if (!event.activeArea) {
          return false;
        }
        const probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]];
        const axisMap = dataMapping[self.renderMethod].idx;
        const dimensions = self.metadata.dimensions;
        const activeArea = event.activeArea;

        let xRatio = (event.relative.x - activeArea[0]) / activeArea[2];
        let yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        if (event.modifier) {
          return false;
        }

        // Clamp bounds
        xRatio = xRatio < 0 ? 0 : xRatio > 1 ? 1 : xRatio;
        yRatio = yRatio < 0 ? 0 : yRatio > 1 ? 1 : yRatio;

        const xPos = Math.floor(xRatio * dimensions[axisMap[0]]);
        const yPos = Math.floor(yRatio * dimensions[axisMap[1]]);

        probe[axisMap[0]] = xPos;
        probe[axisMap[1]] = yPos;

        self.setProbe(probe[0], probe[1], probe[2]);

        return true;
      },
      zoom: (event, envelope) => {
        const probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]];
        const axisMap = dataMapping[self.renderMethod].idx;
        const idx = axisMap[2];

        if (event.modifier) {
          return false;
        }

        probe[idx] += event.deltaY < 0 ? -1 : 1;

        if (probe[idx] < 0) {
          probe[idx] = 0;
          return true;
        }

        if (probe[idx] >= self.metadata.dimensions[idx]) {
          probe[idx] = self.metadata.dimensions[idx] - 1;
          return true;
        }

        self.setProbe(probe[0], probe[1], probe[2]);

        return true;
      },
    };
  }

  // ------------------------------------------------------------------------

  setProbeLineNotification(trigger) {
    this.triggerProbeLines = trigger;
  }

  // ------------------------------------------------------------------------

  getYOffset(slice) {
    let sliceIdx = slice;
    if (sliceIdx === undefined) {
      sliceIdx = this.probeXYZ[2];
    }
    return (
      this.metadata.sprite_size - (sliceIdx % this.metadata.sprite_size) - 1
    );
  }

  // ------------------------------------------------------------------------

  getImage(slice, callback) {
    let sliceIdx = slice;
    if (sliceIdx === undefined) {
      sliceIdx = this.probeXYZ[2];
    }

    // Use the pre-loaded image
    const max = this.metadata.slices.length - 1;

    let idx = Math.floor(sliceIdx / this.metadata.sprite_size);
    idx = idx < 0 ? 0 : idx > max ? max : idx;

    const data = this.lastImageStack[this.metadata.slices[idx]];
    const img = data.image;

    if (img) {
      if (img.complete) {
        callback.call(img);
      } else {
        img.addEventListener('load', callback);
      }
    } else {
      this.workImage.addEventListener('load', callback);
      this.workImage.src = data.url;
    }
  }

  // ------------------------------------------------------------------------

  setProbe(i, j, k) {
    const fn = dataMapping[this.renderMethod].hasChange;
    const idx = dataMapping[this.renderMethod].idx;
    const previousValue = [].concat(this.probeXYZ);
    let x = i;
    let y = j;
    let z = k;

    // Allow i to be [x,y,z]
    if (Array.isArray(i)) {
      z = i[2];
      y = i[1];
      x = i[0];
    }

    if (fn(this.probeXYZ, x, y, z)) {
      this.probeXYZ = [x, y, z];
      this.render();
    } else {
      this.probeXYZ = [x, y, z];
      const dimensions = this.metadata.dimensions;
      const spacing = this.metadata.spacing;

      dataMapping[this.renderMethod].updateProbeValue(this, x, y, z);
      this.pushToFront(
        dimensions[idx[0]],
        dimensions[idx[1]],
        spacing[idx[0]],
        spacing[idx[1]],
        this.probeXYZ[idx[0]],
        this.probeXYZ[idx[1]]
      );
    }

    if (
      previousValue[0] === x &&
      previousValue[1] === y &&
      previousValue[2] === z
    ) {
      return; // No change detected
    }

    // Let other know
    this.emit(PROBE_CHANGE_TOPIC, [x, y, z]);
  }

  // ------------------------------------------------------------------------

  getProbe() {
    return this.probeXYZ;
  }

  // ------------------------------------------------------------------------

  getFieldValueAtProbeLocation() {
    return this.probeValue;
  }

  // ------------------------------------------------------------------------

  getProbeLine(axisIdx) {
    const fieldData = {
      name: this.getField(),
      data: [],
    };
    const probeData = {
      xRange: [0, 100],
      fields: [fieldData],
    };
    let axisToProbe = -1;
    const axisMapping = dataMapping[this.renderMethod].idx;

    for (let i = 0; i < 2; i++) {
      if (axisIdx === axisMapping[i]) {
        axisToProbe = i;
      }
    }

    if (axisToProbe !== -1) {
      const scalarPlan = this.scalars[fieldData.name];
      const dimensions = this.metadata.dimensions;
      const width = dimensions[axisMapping[0]];
      const height = dimensions[axisMapping[1]];
      const deltaStep = axisToProbe === 0 ? 1 : width;
      const offset =
        axisToProbe === 0
          ? this.probeXYZ[axisMapping[1]] * width
          : this.probeXYZ[axisMapping[0]];
      const size = axisToProbe === 0 ? width : height;

      if (this.metadata.origin && this.metadata.spacing) {
        probeData.xRange[0] = this.metadata.origin[axisIdx];
        probeData.xRange[1] =
          this.metadata.origin[axisIdx] +
          this.metadata.spacing[axisIdx] * dimensions[axisIdx];
      }

      if (scalarPlan) {
        for (let j = 0; j < size; j++) {
          fieldData.data.push(scalarPlan[offset + j * deltaStep]);
        }
      }
    }

    return probeData;
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.lastImageStack) {
      return;
    }

    this[`render${this.renderMethod}`]();

    // Update probe value
    dataMapping[this.renderMethod].updateProbeValue(
      this,
      this.probeXYZ[0],
      this.probeXYZ[1],
      this.probeXYZ[2]
    );
  }

  // ------------------------------------------------------------------------

  pushToFront(width, height, scaleX, scaleY, lineX, lineY) {
    this[this.pushMethod](width, height, scaleX, scaleY, lineX, lineY);

    if (this.triggerProbeLines) {
      this.emit(PROBE_LINE_READY_TOPIC, {
        x: this.getProbeLine(0),
        y: this.getProbeLine(1),
        z: this.getProbeLine(2),
      });
    }
  }

  // ------------------------------------------------------------------------

  pushToFrontAsImage(width, height, scaleX, scaleY, lineX, lineY) {
    const destWidth = Math.floor(width * scaleX);
    const destHeight = Math.floor(height * scaleY);
    let ctx = null;

    // Make sure we have a foreground buffer
    if (this.fgCanvas) {
      this.fgCanvas.size(destWidth, destHeight);
    } else {
      this.fgCanvas = new CanvasOffscreenBuffer(destWidth, destHeight);
    }

    ctx = this.fgCanvas.get2DContext();
    ctx.drawImage(
      this.bgCanvas.el,
      0,
      0,
      width,
      height,
      0,
      0,
      destWidth,
      destHeight
    );

    // Draw cross hair probe position
    ctx.beginPath();
    ctx.moveTo(lineX * scaleX, 0);
    ctx.lineTo(lineX * scaleX, destHeight);
    ctx.moveTo(0, lineY * scaleY);
    ctx.lineTo(destWidth, lineY * scaleY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    const readyImage = {
      url: this.fgCanvas.toDataURL(),
      type: this.renderMethod,
      builder: this,
    };

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  pushToFrontAsBuffer(width, height, scaleX, scaleY, lineX, lineY) {
    const destWidth = Math.floor(width * scaleX);
    const destHeight = Math.floor(height * scaleY);

    const readyImage = {
      canvas: this.bgCanvas.el,
      imageData: this.bgCanvas.el
        .getContext('2d')
        .getImageData(0, 0, width, height),
      area: [0, 0, width, height],
      outputSize: [destWidth, destHeight],
      type: this.renderMethod,
      builder: this,
    };

    if (this.broadcastCrossHair) {
      readyImage.crosshair = [lineX, lineY];
    }

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  renderXY() {
    const self = this;
    const ctx = this.bgCanvas.get2DContext();
    const offset = this.getYOffset();
    const xyz = this.probeXYZ;
    const dimensions = this.metadata.dimensions;
    const spacing = this.metadata.spacing;

    function drawThisImage() {
      const image = this;
      ctx.drawImage(
        image,
        0,
        dimensions[1] * offset,
        dimensions[0],
        dimensions[1],
        0,
        0,
        dimensions[0],
        dimensions[1]
      );

      self.extractNumericalValues(dimensions[0], dimensions[1]);
      self.applyLookupTable(dimensions[0], dimensions[1]);
      self.pushToFront(
        dimensions[0],
        dimensions[1],
        spacing[0],
        spacing[1],
        xyz[0],
        xyz[1]
      );
    }

    this.getImage(this.probeXYZ[2], drawThisImage);
  }

  // ------------------------------------------------------------------------

  renderZY() {
    const self = this;
    const ctx = this.bgCanvas.get2DContext();
    const xyz = this.probeXYZ;
    const dimensions = this.metadata.dimensions;
    let activeColumn = dimensions[2];
    const spacing = this.metadata.spacing;

    function processLine() {
      const offset = self.getYOffset(activeColumn);
      const image = this;

      ctx.drawImage(
        image,
        xyz[0],
        dimensions[1] * offset,
        1,
        dimensions[1],
        activeColumn,
        0,
        1,
        dimensions[1]
      );

      if (activeColumn) {
        activeColumn -= 1;
        self.getImage(activeColumn, processLine);
      } else {
        // Rendering is done
        self.extractNumericalValues(dimensions[2], dimensions[1]);
        self.applyLookupTable(dimensions[2], dimensions[1]);
        self.pushToFront(
          dimensions[2],
          dimensions[1],
          spacing[2],
          spacing[1],
          xyz[2],
          xyz[1]
        );
      }
    }

    if (activeColumn) {
      activeColumn -= 1;
      self.getImage(activeColumn, processLine);
    }
  }

  // ------------------------------------------------------------------------

  renderXZ() {
    const self = this;
    const ctx = this.bgCanvas.get2DContext();
    const xyz = this.probeXYZ;
    const dimensions = this.metadata.dimensions;
    const spacing = this.metadata.spacing;
    let activeLine = dimensions[2];

    function processLine() {
      const offset = self.getYOffset(activeLine);
      const image = this;

      ctx.drawImage(
        image,
        0,
        dimensions[1] * offset + xyz[1],
        dimensions[0],
        1,
        0,
        activeLine,
        dimensions[0],
        1
      );

      if (activeLine) {
        activeLine -= 1;
        self.getImage(activeLine, processLine);
      } else {
        // Rendering is done
        self.extractNumericalValues(dimensions[0], dimensions[2]);
        self.applyLookupTable(dimensions[0], dimensions[2]);
        self.pushToFront(
          dimensions[0],
          dimensions[2],
          spacing[0],
          spacing[2],
          xyz[0],
          xyz[2]
        );
      }
    }

    if (activeLine) {
      activeLine -= 1;
      self.getImage(activeLine, processLine);
    }
  }

  // ------------------------------------------------------------------------

  isCrossHairEnabled() {
    return this.broadcastCrossHair;
  }

  // ------------------------------------------------------------------------

  setCrossHairEnable(useCrossHair) {
    if (this.broadcastCrossHair !== useCrossHair) {
      this.broadcastCrossHair = useCrossHair;
      this.emit(CROSSHAIR_VISIBILITY_CHANGE_TOPIC, useCrossHair);
      this.setProbe(this.probeXYZ[0], this.probeXYZ[1], this.probeXYZ[2]);
    }
  }

  // ------------------------------------------------------------------------

  extractNumericalValues(width, height) {
    const ctx = this.bgCanvas.get2DContext();
    const fieldName = this.getField();
    const pixels = ctx.getImageData(0, 0, width, height);
    const pixBuffer = pixels.data;
    const size = pixBuffer.length;
    let idx = 0;
    const fieldRange = this.metadata.ranges[fieldName];
    const delta = fieldRange[1] - fieldRange[0];
    let arrayIdx = 0;
    const array = new Float32Array(width * height);

    while (idx < size) {
      const value =
        ((pixBuffer[idx] +
          256 * pixBuffer[idx + 1] +
          65536 * pixBuffer[idx + 2]) /
          16777216) *
          delta +
        fieldRange[0];
      array[arrayIdx] = value;
      arrayIdx += 1;

      // Move to next pixel
      idx += 4;
    }
    this.scalars[fieldName] = array;
  }

  // ------------------------------------------------------------------------

  applyLookupTable(width, height) {
    const ctx = this.bgCanvas.get2DContext();
    const fieldName = this.getField();
    const lut = this.lookupTableManager.getLookupTable(fieldName);
    const pixels = ctx.getImageData(0, 0, width, height);
    const pixBuffer = pixels.data;
    const size = pixBuffer.length;
    let idx = 0;
    let arrayIdx = 0;
    const array = this.scalars[fieldName];

    if (lut) {
      while (idx < size) {
        const color = lut.getColor(array[arrayIdx]);
        arrayIdx += 1;

        pixBuffer[idx] = Math.floor(255 * color[0]);
        pixBuffer[idx + 1] = Math.floor(255 * color[1]);
        pixBuffer[idx + 2] = Math.floor(255 * color[2]);

        // Move to next pixel
        idx += 4;
      }
      ctx.putImageData(pixels, 0, 0);
    }
  }

  // ------------------------------------------------------------------------

  setField(fieldName) {
    this.queryDataModel.setValue('field', fieldName);
  }

  // ------------------------------------------------------------------------

  getField() {
    return this.queryDataModel.getValue('field');
  }

  // ------------------------------------------------------------------------

  getFields() {
    return this.metadata.fields;
  }

  // ------------------------------------------------------------------------

  setRenderMethod(renderMethod) {
    if (this.renderMethodMutable && this.renderMethod !== renderMethod) {
      this.renderMethod = renderMethod;
      this.render();
      this.emit(RENDER_METHOD_CHANGE_TOPIC, renderMethod);
    }
  }

  // ------------------------------------------------------------------------

  getRenderMethod() {
    return this.renderMethod;
  }

  // ------------------------------------------------------------------------

  /* eslint-disable class-methods-use-this */
  getRenderMethods() {
    return ['XY', 'ZY', 'XZ'];
  }

  // ------------------------------------------------------------------------

  isRenderMethodMutable() {
    return this.renderMethodMutable;
  }

  // ------------------------------------------------------------------------

  setRenderMethodImutable() {
    this.renderMethodMutable = false;
  }

  // ------------------------------------------------------------------------

  setRenderMethodMutable() {
    this.renderMethodMutable = true;
  }

  // ------------------------------------------------------------------------

  getListeners() {
    return this.mouseListener;
  }

  // ------------------------------------------------------------------------

  onProbeLineReady(callback) {
    return this.on(PROBE_LINE_READY_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  onProbeChange(callback) {
    return this.on(PROBE_CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  onRenderMethodChange(callback) {
    return this.on(RENDER_METHOD_CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  onCrosshairVisibilityChange(callback) {
    return this.on(CROSSHAIR_VISIBILITY_CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.off();

    this.bgCanvas = null;
    this.workImage = null;
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    const {
      lookupTable,
      originalRange,
      lookupTableManager,
      queryDataModel,
    } = this.getControlModels();
    const model = this;
    return [
      {
        name: 'LookupTableManagerWidget',
        lookupTable,
        originalRange,
        lookupTableManager,
      },
      {
        name: 'ProbeControl',
        model,
      },
      {
        name: 'QueryDataModelWidget',
        queryDataModel,
      },
    ];
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      queryDataModel: this.queryDataModel,
      lookupTable: this.lookupTableManager.getLookupTable(this.getField()),
      originalRange: this.metadata.ranges[this.getField()],
      lookupTableManager: this.lookupTableManager,
    };
  }
}
