import Monologue from 'monologue.js';

const CHANGE_TOPIC = 'pipeline.change';
const OPACITY_CHANGE_TOPIC = 'opacity.change';
const LAYER_CODE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default class PipelineState {

  constructor(jsonData, hasOpacity = false) {
    this.originalData = jsonData;
    this.visibilityState = {};
    this.activeState = {};
    this.editMode = {};
    this.activeColors = {};
    this.noTrigger = true;
    this.handleOpacity = hasOpacity;
    this.opacityMap = {};
    this.nbLayers = 0;

    // Handle default pipeline if any
    const pipelineQuery = jsonData.CompositePipeline.default_pipeline;
    const layerFields = jsonData.CompositePipeline.layer_fields;
    function isLayerVisible(layers) {
      if (!pipelineQuery || layers.length > 1) {
        return true;
      }

      const layerIdx = LAYER_CODE.indexOf(layers[0]);

      return (pipelineQuery[(layerIdx * 2) + 1] !== '_');
    }
    function getColorCode(layers) {
      if (!pipelineQuery || layers.length > 1) {
        return layerFields[layers][0];
      }

      const layerIdx = LAYER_CODE.indexOf(layers[0]);
      const colorCode = pipelineQuery[(layerIdx * 2) + 1];

      return (colorCode === '_') ? layerFields[layers][0] : colorCode;
    }

    // Fill visibility and activate all layers
    const isRoot = {};
    jsonData.CompositePipeline.pipeline.forEach((item) => {
      isRoot[item.ids.join('')] = true;
      this.setLayerVisible(item.ids.join(''), isLayerVisible(item.ids.join('')));
    });
    jsonData.CompositePipeline.layers.forEach((item) => {
      this.activeState[item] = isRoot[item] ? true : isLayerVisible(item);
      this.activeColors[item] = getColorCode(item);

      // Initialize opacity
      this.opacityMap[item] = 100.0;
      this.nbLayers += 1;
    });

    this.noTrigger = false;
    this.triggerChange();
  }

  // ------------------------------------------------------------------------

  onChange(listener) {
    return this.on(CHANGE_TOPIC, listener);
  }

  // ------------------------------------------------------------------------

  onOpacityChange(listener) {
    return this.on(OPACITY_CHANGE_TOPIC, listener);
  }

  // ------------------------------------------------------------------------

  /* eslint-disable class-methods-use-this */
  TopicChange() {
    return CHANGE_TOPIC;
  }

  // ------------------------------------------------------------------------

  triggerChange() {
    if (this.noTrigger) {
      return;
    }

    const pipelineQuery = this.getPipelineQuery();
    this.emit(CHANGE_TOPIC, pipelineQuery);
  }

  // ------------------------------------------------------------------------

  isLayerActive(layerId) {
    return this.activeState[layerId];
  }

  // ------------------------------------------------------------------------

  setLayerActive(layerId, active) {
    if (this.activeState[layerId] !== active) {
      this.activeState[layerId] = active;
      this.triggerChange();
    }
  }

  // ------------------------------------------------------------------------

  toggleLayerActive(layerId) {
    this.activeState[layerId] = !this.activeState[layerId];
    this.triggerChange();
  }

  // ------------------------------------------------------------------------

  isLayerVisible(layerId) {
    return this.visibilityState[layerId];
  }

  // ------------------------------------------------------------------------

  setLayerVisible(layerId, visible) {
    if (this.visibilityState[layerId] !== visible) {
      this.visibilityState[layerId] = visible;
      let count = layerId.length;
      while (count) {
        count -= 1;
        this.visibilityState[layerId[count]] = visible;
      }
      this.triggerChange();
    }
  }

  // ------------------------------------------------------------------------

  toggleLayerVisible(layerId) {
    this.setLayerVisible(layerId, !this.visibilityState[layerId]);
  }

  // ------------------------------------------------------------------------

  toggleEditMode(layerId) {
    this.editMode[layerId] = !this.editMode[layerId];
    this.triggerChange();
  }

  // ------------------------------------------------------------------------

  isLayerInEditMode(layerId) {
    let found = false;
    Object.keys(this.editMode).forEach((key) => {
      if (this.editMode[key] && key.indexOf(layerId) !== -1) {
        found = true;
      }
    });
    return found;
  }

  // ------------------------------------------------------------------------

  getColor(layerId) {
    return this.originalData.CompositePipeline.layer_fields[layerId[0]];
  }

  // ------------------------------------------------------------------------

  getColorToLabel(colorCode) {
    return this.originalData.CompositePipeline.fields[colorCode];
  }

  // ------------------------------------------------------------------------

  isActiveColor(layerId, colorCode) {
    return this.activeColors[layerId[0]] === colorCode;
  }

  // ------------------------------------------------------------------------

  setActiveColor(layerId, colorCode) {
    let count = layerId.length;
    while (count) {
      count -= 1;
      this.activeColors[layerId[count]] = colorCode;
    }
    this.triggerChange();
  }

  // ------------------------------------------------------------------------
  // Return the encoding of the pipeline configuration

  getPipelineQuery() {
    let query = '';
    this.originalData.CompositePipeline.layers.forEach((item) => {
      const color = this.isLayerActive(item) && this.isLayerVisible(item) ? this.activeColors[item] : '_';
      query += item;
      query += color;
    });
    return query;
  }

  // ------------------------------------------------------------------------

  getPipelineDescription() {
    return this.originalData.CompositePipeline.pipeline;
  }

  // ------------------------------------------------------------------------

  getOpacity(layerCode) {
    return this.opacityMap[layerCode];
  }

  // ------------------------------------------------------------------------

  hasOpacity() {
    return this.handleOpacity;
  }

  // ------------------------------------------------------------------------

  setOpacity(layerCode, alpha) {
    if (this.opacityMap[layerCode] !== alpha) {
      this.opacityMap[layerCode] = alpha;

      const opacityArray = [];
      for (let i = 0; i < this.nbLayers; ++i) {
        opacityArray.push(this.opacityMap[LAYER_CODE[i]] / 100.0);
      }

      this.emit(OPACITY_CHANGE_TOPIC, opacityArray);
    }
  }

  // ------------------------------------------------------------------------

  resetOpacity(alpha) {
    Object.keys(this.opacityMap).forEach((key) => {
      this.opacityMap[key] = alpha;
    });

    const opacityArray = [];
    for (let i = 0; i < this.nbLayers; ++i) {
      opacityArray.push(this.opacityMap[LAYER_CODE[i]] / 100.0);
    }

    this.emit(OPACITY_CHANGE_TOPIC, opacityArray);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(PipelineState);
