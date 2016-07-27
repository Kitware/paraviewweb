import Monologue from 'monologue.js';
import createOperation from './Operations';

const TIME_PROBE_CHANGE = 'TimeProbe.change';
const EDGE_WIDTH_FOR_GRAB = 4;

export class TimeProbe {
  constructor(name, operation, extent = [0, 2, 0, 2]) {
    this.name = name;
    this.operation = operation;
    this.extent = [].concat(extent);
    this.originalExtent = null;
    this.dragActions = [];
    this.active = true;
  }

  updateName(newName) {
    this.name = newName;
    this.emit(TIME_PROBE_CHANGE, this);
  }

  getExtent() {
    return this.extent;
  }

  updateExtent(xMin, xMax, yMin, yMax) {
    var count = 4;
    const oldExtent = [].concat(this.extent);

    this.extent[0] = xMin;
    this.extent[1] = xMax;
    this.extent[2] = yMin;
    this.extent[3] = yMax;

    // Detect changes
    while (count-- && this.extent[count] === oldExtent[count]);
    if (count > -1) {
      this.emit(TIME_PROBE_CHANGE, this);
    }
  }

  drag(event, x, y, scale) {
    if (!this.originalExtent && (x < this.extent[0] - EDGE_WIDTH_FOR_GRAB
        || x > this.extent[1] + EDGE_WIDTH_FOR_GRAB
        || y < this.extent[2] - EDGE_WIDTH_FOR_GRAB
        || y > this.extent[3] + EDGE_WIDTH_FOR_GRAB)) {
      return false;
    }

    if (event.isFirst) {
      this.originalExtent = [].concat(this.extent);
      this.dragActions = [];
      if (x < this.extent[0] + EDGE_WIDTH_FOR_GRAB) {
        this.dragActions.push('left');
      }
      if (x > this.extent[1] - EDGE_WIDTH_FOR_GRAB) {
        this.dragActions.push('right');
      }
      if (y < this.extent[2] + EDGE_WIDTH_FOR_GRAB) {
        this.dragActions.push('top');
      }
      if (y > this.extent[3] - EDGE_WIDTH_FOR_GRAB) {
        this.dragActions.push('bottom');
      }
      if (!this.dragActions.length) {
        this.dragActions.push('drag');
      }
    }

    if (event.isFinal) {
      this.originalExtent = null;
      this.dragActions = [];

      // Sort extent if needed
      if (this.extent[0] > this.extent[1] && this.extent[2] > this.extent[3]) {
        this.extent = [this.extent[1], this.extent[0], this.extent[3], this.extent[2]];
      } else if (this.extent[0] > this.extent[1]) {
        this.extent = [this.extent[1], this.extent[0], this.extent[2], this.extent[3]];
      } else if (this.extent[2] > this.extent[3]) {
        this.extent = [this.extent[0], this.extent[1], this.extent[3], this.extent[2]];
      }

      this.emit(TIME_PROBE_CHANGE, this);
      return true;
    }

    this.dragActions.forEach(action => {
      if (action === 'drag') {
        this.extent[0] = Math.round(this.originalExtent[0] + event.deltaX * scale);
        this.extent[1] = Math.round(this.originalExtent[1] + event.deltaX * scale);
        this.extent[2] = Math.round(this.originalExtent[2] + event.deltaY * scale);
        this.extent[3] = Math.round(this.originalExtent[3] + event.deltaY * scale);
      } else if (action === 'left') {
        this.extent[0] = Math.round(this.originalExtent[0] + event.deltaX * scale);
      } else if (action === 'right') {
        this.extent[1] = Math.round(this.originalExtent[1] + event.deltaX * scale);
      } else if (action === 'top') {
        this.extent[2] = Math.round(this.originalExtent[2] + event.deltaY * scale);
      } else if (action === 'bottom') {
        this.extent[3] = Math.round(this.originalExtent[3] + event.deltaY * scale);
      }
    });

    this.emit(TIME_PROBE_CHANGE, this);
    return true;
  }

  onChange(callback) {
    return this.on(TIME_PROBE_CHANGE, callback);
  }

  processData(arrays, size) {
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;
    const op = createOperation(this.operation);
    const width = size[0];
    const height = size[1];
    const name = this.name;
    const data = [];
    const active = this.active;

    arrays.forEach(array => {
      op.begin();
      for (let x = this.extent[0]; x < this.extent[1]; x++) {
        for (let y = this.extent[2]; y < this.extent[3]; y++) {
          const idx = (height - y - 1) * width + x;
          op.next(array[idx]);
        }
      }
      const value = op.end();
      if (isFinite(value)) {
        min = min < value ? min : value;
        max = max > value ? max : value;
      }
      data.push(value);
    });

    if (min === Number.MAX_VALUE) {
      min = 0;
      max = 1;
    }

    return { name, data, range: [min, max], active };
  }

  setActive(active) {
    this.active = !!active;
  }

  destroy() {
    this.off();
    this.name = null;
    this.operation = null;
    this.extent = null;
  }
}

// ----------------------------------------------------------------------------

export class TimeProbeManager {
  constructor() {
    this.probes = [];
    this.probeSubscriptions = [];
    this.activeProbe = -1;
    this.lastSize = null;

    this._probeChange = probe => {
      this.emit(TIME_PROBE_CHANGE, { probeManager: this, probe });
    };
  }

  setSize(width, height) {
    if (!this.lastSize) {
      this.lastSize = [width, height];
    }
  }

  getActiveProbe() {
    return this.probes[this.activeProbe];
  }

  setActiveProbe(name) {
    this.probes.forEach((probe, index) => {
      if (probe.name === name) {
        this.activeProbe = index;
        this._probeChange(probe);
        return;
      }
    });
  }

  addProbe(probe) {
    if (probe) {
      this.activeProbe = this.probes.length;
      this.probes.push(probe);
      this.probeSubscriptions.push(probe.onChange(this._probeChange));
      this._probeChange(probe);
    } else {
      const width = this.lastSize ? this.lastSize[0] : 200;
      const height = this.lastSize ? this.lastSize[1] : 200;
      const extent = [width / 4, 3 * width / 4, height / 4, 3 * height / 4];
      this.addProbe(new TimeProbe(`Probe ${this.probes.length + 1}`, 'mean', extent));
    }
  }

  removeAllProbes() {
    this.probes = [];
    while (this.probeSubscriptions.length) {
      this.probeSubscriptions.pop().unsubscribe();
    }
    this._probeChange(null);
  }

  removeProbe(name) {
    const idxToRemove = [];
    this.probes = this.probes.filter((i, idx) => {
      if (i.name === name) {
        this.probeSubscriptions[idx].unsubscribe();
        idxToRemove.push(idx);
        return false;
      }
      return true;
    });

    idxToRemove.forEach(idx => this.probeSubscriptions.splice(idx, 1));
    this._probeChange(null);
  }

  getProbe(name) {
    return this.probes.filter(i => i.name === name)[0];
  }

  getProbes() {
    return this.probes;
  }

  sortProbesByName() {
    this.probes.sort((a, b) => a.name.localeCompare(b.name));
  }

  getProbeNames() {
    return this.probes.map(i => i.name);
  }

  drag(event) {
    const { activeArea, relative } = event;
    const x = Math.round((relative.x - activeArea[0]) / activeArea[2] * this.lastSize[0]);
    const y = Math.round((relative.y - activeArea[1]) / activeArea[3] * this.lastSize[1]);
    const scale = this.lastSize[0] / activeArea[2];

    if (event.isFirst) {
      this.dragProbe = null;
    }

    if (this.dragProbe) {
      const eventManaged = this.dragProbe.drag(event, x, y, scale);
      if (event.isFinal) {
        this.dragProbe = null;
      }
      return eventManaged;
    }

    let count = this.probes.length;
    while (count--) {
      const eventManaged = this.probes[count].drag(event, x, y, scale);
      if (eventManaged) {
        this.dragProbe = this.probes[count];
        this.activeProbe = count;
        return true;
      }
    }
    return false;
  }

  processTimeData(arrays) {
    const fields = [];
    this.probes.forEach(probe => {
      fields.push(probe.processData(arrays, this.lastSize));
    });
    return fields;
  }

  onChange(callback) {
    return this.on(TIME_PROBE_CHANGE, callback);
  }

  destroy() {
    this.off();
    while (this.probes.length) {
      this.probes.pop().destroy();
    }
  }
}

Monologue.mixInto(TimeProbe);
Monologue.mixInto(TimeProbeManager);
