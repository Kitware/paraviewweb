/* global window */

import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

const
  PROBE_LINE_READY_TOPIC = 'ProbeImageBuilder.chart.data.ready',
  PROBE_CHANGE_TOPIC = 'ProbeImageBuilder.probe.location.change',
  CROSSHAIR_VISIBILITY_CHANGE_TOPIC = 'ProbeImageBuilder.crosshair.visibility.change',
  RENDER_METHOD_CHANGE_TOPIC = 'ProbeImageBuilder.render.change',
  dataMapping = {
    XY: {
      idx: [0, 1, 2],
      hasChange: (probe, x, y, z) => (probe[2] !== z),
    },
    XZ: {
      idx: [0, 2, 1],
      hasChange: (probe, x, y, z) => (probe[1] !== y),
    },
    ZY: {
      idx: [2, 1, 0],
      hasChange: (probe, x, y, z) => (probe[0] !== x),
    },
  };

export default class BinaryDataProberImageBuilder extends AbstractImageBuilder {

  constructor(queryDataModel, lookupTableManager) {
    super({
      queryDataModel, lookupTableManager,
    });

    this.metadata = queryDataModel.originalData.DataProber;
    this.renderMethodMutable = true;
    this.renderMethod = 'XY';
    this.triggerProbeLines = false;
    this.broadcastCrossHair = true;
    this.probeValue = 0;
    this.probeXYZ = [
      Math.floor(this.metadata.dimensions[0] / 2),
      Math.floor(this.metadata.dimensions[1] / 2),
      Math.floor(this.metadata.dimensions[2] / 2),
    ];
    this.fields = Object.keys(this.metadata.types);
    this.field = this.fields[0];
    this.dataFields = null;
    this.pushMethod = 'pushToFrontAsBuffer';

    // Update LookupTableManager with data range
    this.lookupTableManager.updateActiveLookupTable(this.field);
    this.lookupTableManager.addFields(this.metadata.ranges, this.queryDataModel.originalData.LookupTables);

    let maxSize = 0;
    for (let i = 0; i < 3; ++i) {
      const currentSize = this.metadata.dimensions[i];
      maxSize = (maxSize < currentSize) ? currentSize : maxSize;
    }
    this.bgCanvas = new CanvasOffscreenBuffer(maxSize, maxSize);
    this.registerObjectToFree(this.bgCanvas);

    this.fgCanvas = null;

    // Handle events
    this.registerSubscription(queryDataModel.onDataChange((data, envelope) => {
      this.dataFields = {};
      Object.keys(data).forEach((field) => {
        this.dataFields[field] = new window[this.metadata.types[field]](data[field].data);
      });
      this.render();
    }));

    this.registerSubscription(this.lookupTableManager.onActiveLookupTableChange((data, envelope) => {
      if (this.field !== data) {
        this.field = data;
        this.render();
      }
    }));

    this.registerSubscription(this.lookupTableManager.onChange((data, envelope) => {
      this.update();
    }));

    // Event handler
    const self = this;
    this.mouseListener = {
      click: (event, envelope) => {
        if (!event.activeArea) {
          return false;
        }
        const probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]],
          axisMap = dataMapping[self.renderMethod].idx,
          dimensions = self.metadata.dimensions,
          activeArea = event.activeArea;

        let xRatio = (event.relative.x - activeArea[0]) / activeArea[2],
          yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        if (event.modifier) {
          return false;
        }

        // Clamp bounds
        xRatio = (xRatio < 0) ? 0 : (xRatio > 1) ? 1 : xRatio;
        yRatio = (yRatio < 0) ? 0 : (yRatio > 1) ? 1 : yRatio;

        if (self.renderMethod === 'XZ') {
          // We flipped Y
          yRatio = 1 - yRatio;
        }

        const xPos = Math.floor(xRatio * dimensions[axisMap[0]]),
          yPos = Math.floor(yRatio * dimensions[axisMap[1]]);

        probe[axisMap[0]] = xPos;
        probe[axisMap[1]] = yPos;

        self.setProbe(probe[0], probe[1], probe[2]);

        return true;
      },
      drag: (event, envelope) => {
        if (!event.activeArea) {
          return false;
        }
        const probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]],
          axisMap = dataMapping[self.renderMethod].idx,
          dimensions = self.metadata.dimensions,
          activeArea = event.activeArea;

        let xRatio = (event.relative.x - activeArea[0]) / activeArea[2],
          yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        if (event.modifier) {
          return false;
        }

        // Clamp bounds
        xRatio = (xRatio < 0) ? 0 : (xRatio > 1) ? 1 : xRatio;
        yRatio = (yRatio < 0) ? 0 : (yRatio > 1) ? 1 : yRatio;

        if (self.renderMethod === 'XZ') {
          // We flipped Y
          yRatio = 1 - yRatio;
        }

        const xPos = Math.floor(xRatio * dimensions[axisMap[0]]),
          yPos = Math.floor(yRatio * dimensions[axisMap[1]]);

        probe[axisMap[0]] = xPos;
        probe[axisMap[1]] = yPos;

        self.setProbe(probe[0], probe[1], probe[2]);

        return true;
      },
      zoom: (event, envelope) => {
        var probe = [self.probeXYZ[0], self.probeXYZ[1], self.probeXYZ[2]],
          axisMap = dataMapping[self.renderMethod].idx,
          idx = axisMap[2];

        if (event.modifier) {
          return false;
        }

        probe[idx] += (event.deltaY < 0) ? -1 : 1;

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

  setPushMethodAsBuffer() {
    this.pushMethod = 'pushToFrontAsBuffer';
  }

  // ------------------------------------------------------------------------

  setPushMethodAsImage() {
    this.pushMethod = 'pushToFrontAsImage';
  }

  // ------------------------------------------------------------------------

  setProbeLineNotification(trigger) {
    this.triggerProbeLines = trigger;
  }

  // ------------------------------------------------------------------------

  updateProbeValue() {
    var x = this.probeXYZ[0],
      y = this.probeXYZ[1],
      z = this.probeXYZ[2],
      xSize = this.metadata.dimensions[0],
      ySize = this.metadata.dimensions[1],
      array = this.dataFields[this.field];

    if (array) {
      this.probeValue = array[x + ((ySize - y - 1) * xSize) + (z * xSize * ySize)];
    }
  }

  // ------------------------------------------------------------------------

  setProbe(i, j, k) {
    var fn = dataMapping[this.renderMethod].hasChange;
    var idx = dataMapping[this.renderMethod].idx;
    var previousValue = [].concat(this.probeXYZ);
    var x = i;
    var y = j;
    var z = k;

    // Allow i to be [i,j,k]
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
      const dimensions = this.metadata.dimensions,
        spacing = this.metadata.spacing;

      this.updateProbeValue();

      if (this.renderMethod === 'XZ') {
        // Need to flip Y axis
        this.pushToFront(
          dimensions[idx[0]], dimensions[idx[1]],
          spacing[idx[0]], spacing[idx[1]],
          this.probeXYZ[idx[0]], dimensions[idx[1]] - this.probeXYZ[idx[1]] - 1);
      } else {
        this.pushToFront(dimensions[idx[0]], dimensions[idx[1]], spacing[idx[0]], spacing[idx[1]], this.probeXYZ[idx[0]], this.probeXYZ[idx[1]]);
      }
    }

    if (previousValue[0] === x && previousValue[1] === y && previousValue[2] === z) {
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
    var probeData = {
        xRange: [0, 100],
        fields: [],
      },
      fields = this.fields,
      px = this.probeXYZ[0],
      py = this.probeXYZ[1],
      pz = this.probeXYZ[2],
      xSize = this.metadata.dimensions[0],
      ySize = this.metadata.dimensions[1],
      zSize = this.metadata.dimensions[2],
      idxValues = [];

    if (axisIdx === 0) {
      const offset = ((ySize - py - 1) * xSize) + (pz * xSize * ySize);
      for (let x = 0; x < xSize; x++) {
        idxValues.push(offset + x);
      }
    }
    if (axisIdx === 1) {
      const offset = px + (pz * xSize * ySize);
      for (let y = 0; y < ySize; y++) {
        idxValues.push(offset + ((ySize - y - 1) * xSize));
      }
      idxValues.reverse();
    }
    if (axisIdx === 2) {
      const offset = px + ((ySize - py - 1) * xSize),
        step = xSize * ySize;
      for (let z = 0; z < zSize; z++) {
        idxValues.push(offset + (z * step));
      }
    }

    // Fill all fields
    const dataSize = idxValues.length;
    fields.forEach((name) => {
      var array = this.dataFields[name],
        data = [],
        range = this.lookupTableManager.getLookupTable(name).getScalarRange();

      for (let i = 0; i < dataSize; i++) {
        data.push(array[idxValues[i]]);
      }

      probeData.fields.push({
        name, data, range,
      });
    });

    return probeData;
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.dataFields) {
      return;
    }

    this.updateProbeValue();
    this[`render${this.renderMethod}`]();
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
    var destWidth = Math.floor(width * scaleX),
      destHeight = Math.floor(height * scaleY),
      ctx = null;


    // Make sure we have a foreground buffer
    if (this.fgCanvas) {
      this.fgCanvas.size(destWidth, destHeight);
    } else {
      this.fgCanvas = new CanvasOffscreenBuffer(destWidth, destHeight);
      this.registerObjectToFree(this.fgCanvas);
    }

    ctx = this.fgCanvas.get2DContext();
    ctx.drawImage(this.bgCanvas.el, 0, 0, width, height, 0, 0, destWidth, destHeight);

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
    var destWidth = Math.floor(width * scaleX),
      destHeight = Math.floor(height * scaleY);

    var readyImage = {
      canvas: this.bgCanvas.el,
      imageData: this.bgCanvas.el.getContext('2d').getImageData(0, 0, width, height),
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
    var ctx = this.bgCanvas.get2DContext(),
      xyz = this.probeXYZ,
      dimensions = this.metadata.dimensions,
      xSize = dimensions[0],
      ySize = dimensions[1],
      spacing = this.metadata.spacing,
      imageBuffer = ctx.createImageData(dimensions[0], dimensions[1]),
      pixels = imageBuffer.data,
      imageSize = dimensions[0] * dimensions[1],
      offset = imageSize * xyz[2],
      lut = this.lookupTableManager.getLookupTable(this.field),
      array = this.dataFields[this.field];

    // Need to flip along Y
    var idx = 0;
    for (let y = 0; y < ySize; y++) {
      for (let x = 0; x < xSize; x++) {
        const color = lut.getColor(array[offset + x + (xSize * (ySize - y - 1))]);
        pixels[idx * 4] = 255 * color[0];
        pixels[(idx * 4) + 1] = 255 * color[1];
        pixels[(idx * 4) + 2] = 255 * color[2];
        pixels[(idx * 4) + 3] = 255;
        idx += 1;
      }
    }

    ctx.putImageData(imageBuffer, 0, 0);
    this.pushToFront(dimensions[0], dimensions[1], spacing[0], spacing[1], xyz[0], xyz[1]);
  }

  // ------------------------------------------------------------------------

  renderZY() {
    var ctx = this.bgCanvas.get2DContext(),
      xyz = this.probeXYZ,
      dimensions = this.metadata.dimensions,
      offsetX = xyz[0],
      stepY = dimensions[0],
      stepZ = dimensions[0] * dimensions[1],
      ySize = dimensions[1],
      zSize = dimensions[2],
      spacing = this.metadata.spacing,
      imageBuffer = ctx.createImageData(dimensions[2], dimensions[1]),
      pixels = imageBuffer.data,
      lut = this.lookupTableManager.getLookupTable(this.field),
      array = this.dataFields[this.field];

    // FIXME data is flipped
    var idx = 0;
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        const color = lut.getColor(array[offsetX + (stepY * (ySize - y - 1)) + (stepZ * z)]);
        pixels[idx * 4] = 255 * color[0];
        pixels[(idx * 4) + 1] = 255 * color[1];
        pixels[(idx * 4) + 2] = 255 * color[2];
        pixels[(idx * 4) + 3] = 255;
        idx += 1;
      }
    }
    ctx.putImageData(imageBuffer, 0, 0);
    this.pushToFront(dimensions[2], dimensions[1], spacing[2], spacing[1], xyz[2], xyz[1]);
  }

  // ------------------------------------------------------------------------

  renderXZ() {
    var ctx = this.bgCanvas.get2DContext(),
      xyz = this.probeXYZ,
      dimensions = this.metadata.dimensions,
      xSize = dimensions[0],
      zSize = dimensions[2],
      zStep = xSize * dimensions[1],
      offset = xSize * (dimensions[1] - xyz[1] - 1),
      spacing = this.metadata.spacing,
      imageBuffer = ctx.createImageData(xSize, zSize),
      pixels = imageBuffer.data,
      lut = this.lookupTableManager.getLookupTable(this.field),
      array = this.dataFields[this.field];

    var idx = 0;
    for (let z = 0; z < zSize; z++) {
      for (let x = 0; x < xSize; x++) {
        const color = lut.getColor(array[offset + x + ((zSize - z - 1) * zStep)]);
        pixels[idx * 4] = 255 * color[0];
        pixels[(idx * 4) + 1] = 255 * color[1];
        pixels[(idx * 4) + 2] = 255 * color[2];
        pixels[(idx * 4) + 3] = 255;
        idx += 1;
      }
    }

    ctx.putImageData(imageBuffer, 0, 0);
    this.pushToFront(dimensions[0], dimensions[2], spacing[0], spacing[2], xyz[0], zSize - xyz[2] - 1);
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

  setField(value) {
    this.field = value;
  }

  // ------------------------------------------------------------------------

  getField() {
    return this.field;
  }

  // ------------------------------------------------------------------------

  getFields() {
    return this.fields;
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
    this.fgCanvas = null;
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    var model = this,
      {
        lookupTableManager, queryDataModel,
      } = this.getControlModels();
    return [
      {
        name: 'LookupTableManagerWidget',
        lookupTableManager,
      }, {
        name: 'ProbeControl',
        model,
      }, {
        name: 'QueryDataModelWidget',
        queryDataModel,
      },
    ];
  }

}
