const encoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function createColorLookupConst(lut, value) {
  return idx => lut.getColor(value);
}

function createColorLookup(lut, floatMap, layer, color) {
  return idx => lut.getColor(floatMap[layer][color][idx]);
}

export default class ColorByHelper {
  constructor(layers, fieldCodes, lookupTableManager) {
    this.nbLayers = layers.length;
    this.fieldCodes = fieldCodes;
    this.lookupTableManager = lookupTableManager;
    this.layerFloatData = {};
    this.layerVisible = {};
    this.layerAlpha = {};
    this.layerColorBy = {};
    this.layerGetColor = {};
    this.categories = [];

    // Fill function map to get color
    for (let layerIdx = 0; layerIdx < this.nbLayers; layerIdx++) {
      this.layerFloatData[encoding[layerIdx]] = {};
      this.layerVisible[encoding[layerIdx]] = 1.0;
      this.layerAlpha[encoding[layerIdx]] = 1.0;
      this.layerGetColor[encoding[layerIdx]] = {};

      const array = layers[layerIdx].colorBy;
      let count = array.length;
      while (count) {
        count -= 1;
        const colorBy = array[count];
        const layerCode = encoding[layerIdx];
        const colorName = colorBy.name;
        const lut = this.lookupTableManager.getLookupTable(colorBy.name);

        if (colorBy.type === 'const') {
          this.layerGetColor[layerCode][colorName] = createColorLookupConst(lut, colorBy.value);
        } else if (colorBy.type === 'field') {
          this.layerGetColor[layerCode][colorName] = createColorLookup(lut, this.layerFloatData, layerCode, colorName);
        }
      }
    }
  }

  updateData(data) {
    Object.keys(data).forEach((name) => {
      if (name.indexOf('_') !== -1) {
        const splitName = name.split('_');
        const layerName = encoding[Number(splitName.shift())];
        const colorBy = splitName.join('_');

        this.layerFloatData[layerName][colorBy] = new Float32Array(data[name].data);
      }
    });
  }

  updatePipeline(query) {
    this.categories = [];
    for (let layerIdx = 0; layerIdx < this.nbLayers; layerIdx++) {
      const layerCode = encoding[layerIdx],
        colorCode = query[(layerIdx * 2) + 1];

      if (colorCode === '_') {
        this.layerVisible[layerCode] = 0.0;
      } else {
        this.layerVisible[layerCode] = 1.0;
        this.layerColorBy[layerCode] = this.fieldCodes[colorCode];
        this.categories.push([layerIdx, this.fieldCodes[colorCode]].join('_'));
      }
    }
  }

  updateAlphas(alphas) {
    for (let i = 0; i < this.nbLayers; i++) {
      this.layerAlpha[encoding[i]] = alphas[i];
    }
  }

  hasNoContent(layerIdx) {
    var layerCode = encoding[layerIdx],
      alpha = this.layerAlpha[layerCode] * this.layerVisible[layerCode];
    return (alpha === 0);
  }

  getColor(layerIdx, pixelIdx) {
    var layerCode = encoding[layerIdx],
      color = this.layerGetColor[layerCode][this.layerColorBy[layerCode]](pixelIdx),
      alpha = this.layerAlpha[layerCode] * this.layerVisible[layerCode];

    return [color[0] * 255, color[1] * 255, color[2] * 255, color[3] * alpha];
  }

  getCategories() {
    return this.categories;
  }

  getLayerColorByName(layerIdx) {
    return this.layerColorBy[encoding[layerIdx]];
  }

  getLayerVisible(layerIdx) {
    return this.layerVisible[encoding[layerIdx]];
  }

  getLayerLut(layerIdx) {
    return this.lookupTableManager.getLookupTable(this.layerColorBy[encoding[layerIdx]]);
  }

  getLayerFloatData(layerIdx) {
    var layerName = encoding[layerIdx];
    return this.layerFloatData[layerName][this.layerColorBy[layerName]];
  }

  getLayerAlpha(layerIdx) {
    return this.layerAlpha[encoding[layerIdx]];
  }
}
