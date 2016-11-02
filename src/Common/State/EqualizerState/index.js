import Monologue from 'monologue.js';

const
    CHANGE_TOPIC = 'model.change';

export default class EqualizerState {

  constructor({ size = 1, colors = ['#cccccc'], lookupTable = null, scalars = [] }) {
    this.size = size;
    this.scalars = scalars;
    this.lookupTable = lookupTable;
    this.colors = colors;

    // Handle colors
    if (lookupTable) {
      const convertColor = (color) => {
        var R = Math.floor(color[0] * 255);
        var G = Math.floor(color[1] * 255);
        var B = Math.floor(color[2] * 255);
        return `rgb(${R},${G},${B})`;
      };
      const callback = (data, envelope) => {
        for (let idx = 0; idx < this.size; idx++) {
          const color = this.lookupTable.getColor(this.scalars[idx]);
          this.colors[idx] = convertColor(color);
        }
        if (envelope) {
          this.emit(CHANGE_TOPIC, this);
        }
      };

      this.lutChangeSubscription = this.lookupTable.onChange(callback);
      callback();
    }

    // Fill opacity
    this.opacities = [];
    while (this.opacities.length < this.size) {
      this.opacities.push(-1);
    }

    // Make the updateOpacities a closure to prevent any this issue
    // when using it as a callback
    this.updateOpacities = (values) => {
      var changeDetected = false;
      for (let i = 0; i < this.size; i++) {
        changeDetected = changeDetected || (this.opacities[i] !== values[i]);
        this.opacities[i] = values[i];
      }
      if (changeDetected) {
        this.emit(CHANGE_TOPIC, this);
      }
    };

    // Make the resetOpacities a closure to prevent any this issue
    // when using it as a callback
    this.resetOpacities = () => {
      var opacityStep = 1.0 / this.size;
      var opacity = 0.0;
      var changeDetected = false;

      for (let i = 0; i < this.size; i++) {
        opacity += opacityStep;
        changeDetected = changeDetected || (this.opacities[i] !== opacity);
        this.opacities[i] = opacity;
      }
      if (changeDetected) {
        this.emit(CHANGE_TOPIC, this);
      }
    };
    this.resetOpacities();
  }

  // ------------------------------------------------------------------------

  getOpacities() {
    return this.opacities;
  }

  // ------------------------------------------------------------------------

  getColors() {
    return this.colors;
  }

  // ------------------------------------------------------------------------

  onChange(callback) {
    return this.on(CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  /* eslint-disable */
  bind(listOfStateToBind) {
    let changeInProgress = false;
    const applyChange = (instance) => {
      if (changeInProgress) {
        return;
      }
      changeInProgress = true;
      const newValues = instance.getOpacities();
      listOfStateToBind.forEach((other) => {
        if (other !== instance) {
          other.updateOpacities(newValues);
        }
      });
      changeInProgress = false;
    };

    listOfStateToBind.forEach((toMonitor) => {
      toMonitor.onChange(applyChange);
    });
  }
  /* eslint-enable */

  // ------------------------------------------------------------------------

  destroy() {
    this.off();

    this.lutChangeSubscription.unsubscribe();
    this.lutChangeSubscription = null;
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(EqualizerState);
