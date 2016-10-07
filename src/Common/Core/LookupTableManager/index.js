import Monologue    from 'monologue.js';
import LookupTable  from '../LookupTable';

const TOPIC = {
  CHANGE: 'LookupTable.change',
  ACTIVE_CHANGE: 'LookupTable.active.change',
  LIST_CHANGE: 'LookupTable.list.change',
};

export default class LookupTableManager {

  constructor() {
    this.luts = {};
    this.lutSubscriptions = {};

    this.onChangeCallback = (data, envelope) => {
      this.emit(TOPIC.CHANGE, data);
    };
  }

  addLookupTable(name, range, preset) {
    if (!this.activeField) {
      this.activeField = name;
    }

    let lut = this.luts[name];
    if (lut === undefined) {
      lut = new LookupTable(name);

      this.luts[name] = lut;
      this.lutSubscriptions[name] = lut.onChange(this.onChangeCallback);
    }

    lut.setPreset(preset || 'spectralflip');
    lut.setScalarRange(range[0], range[1]);

    this.emit(TOPIC.LIST_CHANGE, this);

    return lut;
  }

  removeLookupTable(name) {
    if (this.luts.hasOwn(name)) {
      this.lutSubscriptions[name].unsubscribe();
      this.luts[name].destroy();

      delete this.luts[name];
      delete this.lutSubscriptions[name];

      this.emit(TOPIC.LIST_CHANGE, this);
    }
  }

  updateActiveLookupTable(name) {
    setImmediate(() => {
      this.emit(TOPIC.ACTIVE_CHANGE, name);
    });
    this.activeField = name;
  }

  getLookupTable(name) {
    return this.luts[name];
  }

  addFields(fieldsRange, lutConfigs) {
    Object.keys(fieldsRange).forEach((field) => {
      const lut = this.addLookupTable(field, fieldsRange[field]);
      if (lutConfigs && lutConfigs[field]) {
        if (lutConfigs[field].discrete !== undefined) {
          lut.discrete = lutConfigs[field].discrete;
        }
        if (lutConfigs[field].preset) {
          lut.setPreset(lutConfigs[field].preset);
        } else if (lutConfigs[field].controlpoints) {
          lut.updateControlPoints(lutConfigs[field].controlpoints);
        }
        if (lutConfigs[field].range) {
          lut.setScalarRange(lutConfigs[field].range[0], lutConfigs[field].range[1]);
        }
      }
    });
  }

  getActiveField() {
    return this.activeField;
  }

  onChange(callback) {
    return this.on(TOPIC.CHANGE, callback);
  }

  onFieldsChange(callback) {
    return this.on(TOPIC.LIST_CHANGE, callback);
  }

  onActiveLookupTableChange(callback) {
    return this.on(TOPIC.ACTIVE_CHANGE, callback);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(LookupTableManager);

