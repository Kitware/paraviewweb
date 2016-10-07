import Monologue from 'monologue.js';
import Presets   from './Presets';

const
    CHANGE_TOPIC = 'LookupTable.change';

// Global helper methods ------------------------------------------------------

function applyRatio(a, b, ratio) {
  return ((b - a) * ratio) + a;
}

function interpolateColor(pointA, pointB, scalar) {
  var ratio = (scalar - pointA[0]) / (pointB[0] - pointA[0]);
  return [
    applyRatio(pointA[1], pointB[1], ratio),
    applyRatio(pointA[2], pointB[2], ratio),
    applyRatio(pointA[3], pointB[3], ratio),
    255,
  ];
}

function extractPoint(controlPoints, idx) {
  return [
    controlPoints[idx].x,
    controlPoints[idx].r,
    controlPoints[idx].g,
    controlPoints[idx].b,
  ];
}

function xrgbCompare(a, b) {
  return (a.x - b.x);
}

// ----------------------------------------------------------------------------

export default class LookupTable {

  constructor(name, discrete = false) {
    this.name = name;
    this.scalarRange = [0, 1];
    this.delta = 1;
    this.controlPoints = null;
    this.colorTableSize = 256;
    this.colorTable = null;
    this.colorNaN = [0, 0, 0, 0];
    this.setPreset('spectralflip');
    this.discrete = discrete;
    this.scale = 1;

    // Auto rebuild
    this.build();
  }

  getName() {
    return this.name;
  }

  /* eslint-disable class-methods-use-this */
  getPresets() {
    return Object.keys(Presets.lookuptables);
  }

  setPreset(name) {
    this.colorTable = null;
    this.controlPoints = [];

    const colors = Presets.lookuptables[name].controlpoints;
    const count = colors.length;

    for (let i = 0; i < count; i++) {
      this.controlPoints.push({
        x: colors[i].x,
        r: colors[i].r,
        g: colors[i].g,
        b: colors[i].b,
      });
    }

    // Auto rebuild
    this.build();

    this.emit(CHANGE_TOPIC, { change: 'preset', lut: this });
  }

  updateControlPoints(controlPoints) {
    this.colorTable = null;
    this.controlPoints = [];

    const count = controlPoints.length;

    for (let i = 0; i < count; i++) {
      this.controlPoints.push({
        x: controlPoints[i].x,
        r: controlPoints[i].r,
        g: controlPoints[i].g,
        b: controlPoints[i].b,
      });
    }

    // Auto rebuild
    this.build();

    this.emit(CHANGE_TOPIC, { change: 'controlPoints', lut: this });
  }

  setColorForNaN(r = 0, g = 0, b = 0, a = 0) {
    this.colorNaN = [r, g, b, a];
  }

  getColorForNaN() {
    return this.colorNaN;
  }

  getScalarRange() {
    return [Number(this.scalarRange[0]), Number(this.scalarRange[1])];
  }

  setScalarRange(min, max) {
    this.scalarRange = [min, max];
    this.delta = max - min;

    this.emit(CHANGE_TOPIC, { change: 'scalarRange', lut: this });
  }

  build(trigger) {
    var currentControlIdx = 0;

    if (this.colorTable) {
      return;
    }

    this.colorTable = [];
    if (this.discrete) {
      this.colorTableSize = this.controlPoints.length;
      this.scale = 50;
      for (let idx = 0; idx < this.colorTableSize; idx++) {
        const color = this.controlPoints[idx];
        this.colorTable.push([color.r, color.g, color.b, 255]);
      }
    } else {
      this.scale = 1;
      for (let idx = 0; idx < this.colorTableSize; idx++) {
        const value = idx / (this.colorTableSize - 1);
        let pointA = extractPoint(this.controlPoints, currentControlIdx);
        let pointB = extractPoint(this.controlPoints, currentControlIdx + 1);

        if (value > pointB[0]) {
          currentControlIdx += 1;
          pointA = extractPoint(this.controlPoints, currentControlIdx);
          pointB = extractPoint(this.controlPoints, currentControlIdx + 1);
        }

        this.colorTable.push(interpolateColor(pointA, pointB, value));
      }
    }

    if (trigger) {
      this.emit(CHANGE_TOPIC, { change: 'controlPoints', lut: this });
    }
  }

  setNumberOfColors(nbColors) {
    this.colorTableSize = nbColors;
    this.colorTable = null;

    // Auto rebuild
    this.build();

    this.emit(CHANGE_TOPIC, { change: 'numberOfColors', lut: this });
  }

  getNumberOfControlPoints() {
    return this.controlPoints ? this.controlPoints.length : 0;
  }

  removeControlPoint(idx) {
    if (idx > 0 && idx < this.controlPoints.length - 1) {
      this.controlPoints.splice(idx, 1);

      // Auto rebuild and trigger change
      this.colorTable = null;
      this.build(true);

      return true;
    }
    return false;
  }

  getControlPoint(idx) {
    return this.controlPoints[idx];
  }

  updateControlPoint(idx, xrgb) {
    this.controlPoints[idx] = xrgb;
    const xValue = xrgb.x;

    // Ensure order
    this.controlPoints.sort(xrgbCompare);

    // Auto rebuild and trigger change
    this.colorTable = null;
    this.build(true);

    // Return the modified index of current control point
    for (let i = 0; i < this.controlPoints.length; i++) {
      if (this.controlPoints[i].x === xValue) {
        return i;
      }
    }
    return 0;
  }

  addControlPoint(xrgb) {
    this.controlPoints.push(xrgb);
    const xValue = xrgb.x;

    // Ensure order
    this.controlPoints.sort(xrgbCompare);

    // Auto rebuild and trigger change
    this.colorTable = null;
    this.build(true);

    // Return the modified index of current control point
    for (let i = 0; i < this.controlPoints.length; i++) {
      if (this.controlPoints[i].x === xValue) {
        return i;
      }
    }
    return -1;
  }

  drawToCanvas(canvas) {
    var colors = this.colorTable;
    var length = this.scale * colors.length;
    var ctx = canvas.getContext('2d');
    var canvasData = ctx.getImageData(0, 0, length, 1);

    for (let i = 0; i < length; i++) {
      const colorIdx = Math.floor(i / this.scale);
      canvasData.data[(i * 4) + 0] = Math.floor(255 * colors[colorIdx][0]);
      canvasData.data[(i * 4) + 1] = Math.floor(255 * colors[colorIdx][1]);
      canvasData.data[(i * 4) + 2] = Math.floor(255 * colors[colorIdx][2]);
      canvasData.data[(i * 4) + 3] = 255;
    }
    ctx.putImageData(canvasData, 0, 0);
  }

  getColor(scalar) {
    if (isNaN(scalar)) {
      return this.colorNaN;
    }
    const idxValue = Math.floor((this.colorTableSize * (scalar - this.scalarRange[0])) / this.delta);
    if (idxValue < 0) {
      return this.colorTable[0];
    }
    if (idxValue >= this.colorTableSize) {
      return this.colorTable[this.colorTable.length - 1];
    }
    return this.colorTable[idxValue];
  }

  destroy() {
    this.off();
  }

  onChange(callback) {
    return this.on(CHANGE_TOPIC, callback);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(LookupTable);

