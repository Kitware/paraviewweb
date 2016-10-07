/* global window */

import contains              from 'mout/src/array/contains';
import equals                from 'mout/src/object/equals';

import AbstractImageBuilder  from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

const
  PROBE_CHANGE_TOPIC = 'probe-change',
  TIME_DATA_READY = 'time-data-ready';

export default class FloatDataImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(queryDataModel, lookupTableManager) {
    super({ queryDataModel, lookupTableManager, handleRecord: true, dimensions: queryDataModel.originalData.FloatImage.dimensions });

    this.timeDataQueryDataModel = queryDataModel.clone();
    this.registerObjectToFree(this.timeDataQueryDataModel);

    this.light = 200;
    this.meshColor = [50, 50, 50];
    this.timeData = {
      data: [],
      pending: false,
    };

    this.metadata = queryDataModel.originalData.FloatImage;
    this.layers = this.metadata.layers;
    this.dimensions = this.metadata.dimensions;
    this.timeProbe = {
      x: this.dimensions[0] / 2,
      y: this.dimensions[1] / 2,
      query: this.timeDataQueryDataModel.getQuery(),
      enabled: false,
      draw: true,
      pending: false,
      forceUpdate: false,
      tIdx: this.queryDataModel.getIndex('time') || 0,
      updateValue: () => {
        this.timeProbe.value = this.timeProbe.dataValues ? this.timeProbe.dataValues[this.timeProbe.tIdx] : (this.timeProbe.pending ? 'Fetching...' : '');
      },
      triggerChange: () => {
        this.timeProbe.forceUpdate = false;
        this.timeProbe.updateValue();
        this.emit(PROBE_CHANGE_TOPIC, this.timeProbe);
      },
    };
    this.bgCanvas = new CanvasOffscreenBuffer(this.dimensions[0], this.dimensions[1]);
    this.registerObjectToFree(this.bgCanvas);

    // Update LookupTableManager with data range
    this.lookupTableManager.addFields(this.metadata.ranges, this.queryDataModel.originalData.LookupTables);

    // Handle events
    this.registerSubscription(queryDataModel.onStateChange(() => {
      if (this.timeProbe.tIdx !== this.queryDataModel.getIndex('time')) {
        this.timeProbe.tIdx = this.queryDataModel.getIndex('time');
        this.timeProbe.triggerChange();
      } else {
        this.render();
      }
      this.update();
    }));

    this.registerSubscription(queryDataModel.on('pipeline_data', (data, envelope) => {
      this.layers.forEach((item) => {
        var dataId = `${item.name}_${item.array}`,
          dataLight = `${item.name}__light`,
          dataMesh = `${item.name}__mesh`;
        if (item.active && data[dataId]) {
          item.data = new window[item.type](data[dataId].data);
          item.light = new Uint8Array(data[dataLight].data);
          if (data[dataMesh]) {
            item.mesh = new Uint8Array(data[dataMesh].data);
          }
        }
      });
      this.render();
    }));

    this.registerSubscription(this.lookupTableManager.onChange((data, envelope) => {
      this.render();
    }));

    // Handle time data
    this.registerSubscription(this.timeDataQueryDataModel.on('pipeline_data', (data, envelope) => {
      this.timeData.data.push(data);
      if (this.timeData.data.length < this.timeDataQueryDataModel.getSize('time')) {
        this.timeDataQueryDataModel.next('time');
        this.timeData.pending = true;
        this.timeProbe.pending = true;
        const categories = this.getCategories();
        this.timeDataQueryDataModel.fetchData({
          name: 'pipeline_data',
          categories,
        });
      } else {
        this.timeData.pending = false;
        this.timeProbe.pending = false;
        if (this.timeProbe.enabled) {
          this.getTimeChart();
        }
        this.timeProbe.triggerChange();
        this.emit(TIME_DATA_READY, { fields: [], xRange: [0, this.timeDataQueryDataModel.getSize('time')], fullData: this.timeData });
      }
    }));
  }

  // ------------------------------------------------------------------------

  getCategories() {
    var categories = [];

    this.layers.forEach((layer) => {
      if (layer.active) {
        categories.push([layer.name, layer.array].join('_'));
        categories.push(`${layer.name}__light`);
        if (layer.hasMesh && layer.meshActive) {
          categories.push(`${layer.name}__mesh`);
        }
      }
    });

    return categories;
  }

  // ------------------------------------------------------------------------

  update() {
    var categories = this.getCategories();
    this.queryDataModel.fetchData({
      name: 'pipeline_data',
      categories,
    });
  }

  // ------------------------------------------------------------------------

  fetchTimeData() {
    var categories = this.getCategories(),
      query = this.queryDataModel.getQuery();

    // Prevent concurrent data fetching for time
    if (this.timeData.pending || !this.timeDataQueryDataModel.getValues('time')) {
      return;
    }

    this.timeData.pending = true;
    this.timeProbe.pending = true;
    this.timeProbe.triggerChange();

    // Reset time data
    this.timeData.data = [];
    this.timeProbe.query = query;

    // Synch the time query data model
    Object.keys(query).forEach((key) => {
      this.timeDataQueryDataModel.setValue(key, query[key]);
    });

    this.timeDataQueryDataModel.first('time');
    this.timeDataQueryDataModel.fetchData({
      name: 'pipeline_data',
      categories,
    });
  }

  // ------------------------------------------------------------------------

  /* eslint-disable complexity */
  getTimeChart(xx, yy) {
    var x = xx;
    var y = yy;
    var probeHasChanged = !this.timeProbe.enabled || this.timeProbe.forceUpdate;
    this.timeProbe.enabled = true;

    // this.timeProbe.value = '';
    if (x === undefined && y === undefined) {
      x = this.timeProbe.x;
      y = this.timeProbe.y;
    } else {
      probeHasChanged = probeHasChanged || this.timeProbe.x !== x || this.timeProbe.y !== y;
      this.timeProbe.x = x;
      this.timeProbe.y = y;
    }

    const qA = this.queryDataModel.getQuery(),
      qB = this.timeProbe.query;

    // Time is irrelevant
    qB.time = qA.time;
    if (this.timeData.data.length === 0 || !equals(qA, qB)) {
      this.fetchTimeData();
      return;
    }

    // Find the layer under (x,y)
    const width = this.dimensions[0],
      height = this.dimensions[1],
      idx = ((height - y - 1) * width) + x;

    let arrayType = '',
      field = null,
      layerName = null;

    this.layers.forEach((layer) => {
      if (layer.active && !isNaN(layer.data[idx])) {
        arrayType = layer.type;
        field = layer.array;
        layerName = layer.name;
      }
    });

    // Make sure the loaded data is the one we need to plot
    if (layerName && this.timeProbe.layer !== layerName && field && this.timeProbe.field !== field) {
      this.timeProbe.layer = layerName;
      this.timeProbe.field = field;

      if (this.timeProbe.layer && this.timeProbe.field) {
        this.fetchTimeData();
      }
      return;
    }

    // Build chart data information
    const timeValues = this.timeDataQueryDataModel.getValues('time'),
      dataValues = [],
      chartData = {
        xRange: [Number(timeValues[0]), Number(timeValues[timeValues.length - 1])],
        fields: [{
          name: field,
          data: dataValues,
        }],
      },
      timeSize = this.timeData.data.length;

    if (field && this.lookupTableManager.getLookupTable(field)) {
      chartData.fields[0].range = this.lookupTableManager.getLookupTable(field).getScalarRange();
    }

    // Keep track of the chart values
    this.timeProbe.dataValues = dataValues;
    this.timeProbe.tIdx = this.queryDataModel.getIndex('time');

    const layerNameField = `${layerName}_${field}`;
    if (layerName && field && this.timeData.data[0][layerNameField]) {
      for (let i = 0; i < timeSize; i++) {
        const floatArray = new window[arrayType](this.timeData.data[i][layerNameField].data);
        dataValues.push(floatArray[idx]);
      }
    } else if (layerName && field && !this.timeData.data[0][layerNameField]) {
      this.fetchTimeData();
    }

    this.emit(TIME_DATA_READY, chartData);
    if (probeHasChanged) {
      this.timeProbe.triggerChange();
    }
    this.render();
  }
  /* eslint-enable complexity */

  // ------------------------------------------------------------------------

  render() {
    var ctx = this.bgCanvas.get2DContext(),
      width = this.dimensions[0],
      height = this.dimensions[1],
      size = width * height,
      imageData = ctx.createImageData(width, height),
      pixels = imageData.data;

    function flipY(idx) {
      var x = idx % width,
        y = Math.floor(idx / width);

      return ((height - y - 1) * width) + x;
    }

    ctx.clearRect(0, 0, width, height);
    this.layers.forEach((layer) => {
      if (layer.active) {
        const lut = this.lookupTableManager.getLookupTable(layer.array);
        for (let i = 0; i < size; i++) {
          const flipedY = flipY(i),
            color = lut.getColor(layer.data[flipedY]),
            light = layer.light ? (layer.light[flipedY] ? layer.light[flipedY] - this.light : 0) : 0;

          if (color[3]) {
            pixels[(i * 4) + 0] = (color[0] * 255) + light;
            pixels[(i * 4) + 1] = (color[1] * 255) + light;
            pixels[(i * 4) + 2] = (color[2] * 255) + light;
            pixels[(i * 4) + 3] = (color[3] * 255);

            if (layer.hasMesh && layer.meshActive && layer.mesh && layer.mesh[flipedY]) {
              pixels[(i * 4) + 0] = this.meshColor[0];
              pixels[(i * 4) + 1] = this.meshColor[1];
              pixels[(i * 4) + 2] = this.meshColor[2];
            }
          }
        }
      }
    });
    ctx.putImageData(imageData, 0, 0);

    // Update draw flag based on query
    const currentQuery = this.queryDataModel.getQuery();
    this.timeProbe.query.time = currentQuery.time; // We don't care about time
    this.timeProbe.draw = equals(this.timeProbe.query, currentQuery);

    // Draw time probe if enabled
    if (this.timeProbe.enabled && this.timeProbe.draw) {
      const x = this.timeProbe.x,
        y = this.timeProbe.y,
        delta = 10;

      ctx.beginPath();
      ctx.moveTo(x - delta, y);
      ctx.lineTo(x + delta, y);
      ctx.moveTo(x, y - delta);
      ctx.lineTo(x, y + delta);

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }

    const readyImage = {
      canvas: this.bgCanvas.el,
      area: [0, 0, width, height],
      outputSize: [width, height],
      builder: this,
      arguments: this.queryDataModel.getQuery(),
    };

    // FIXME should add var for pipeline

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  onTimeDataReady(callback) {
    return this.on(TIME_DATA_READY, callback);
  }

  // ------------------------------------------------------------------------

  onProbeChange(callback) {
    return this.on(PROBE_CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.off();

    this.bgCanvas = null;
    this.dimensions = null;
    this.layers = null;
    this.light = null;
    this.meshColor = null;
    this.metadata = null;
    this.timeData = null;
    this.timeDataQueryDataModel = null;
    this.timeProbe = null;
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    var model = this,
      { lookupTableManager, queryDataModel } = this.getControlModels();

    return [
      {
        name: 'LookupTableManagerWidget',
        lookupTableManager,
      }, {
        name: 'FloatImageControl',
        model,
      }, {
        name: 'QueryDataModelWidget',
        queryDataModel,
      },
    ];
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      lookupTableManager: this.lookupTableManager,
      queryDataModel: this.queryDataModel,
    };
  }

  // ------------------------------------------------------------------------
  // FIXME method below should be encapsulated in a State/Model
  // ------------------------------------------------------------------------

  isMultiView() {
    return !contains(this.queryDataModel.originalData.type, 'single-view');
  }

  // ------------------------------------------------------------------------

  getLayers() {
    return this.layers;
  }

  // ------------------------------------------------------------------------

  setLight(lightValue) {
    if (this.light !== lightValue) {
      this.light = lightValue;
      this.render();
    }
  }

  // ------------------------------------------------------------------------

  getLight() {
    return this.light;
  }

  // ------------------------------------------------------------------------

  getTimeProbe() {
    return this.timeProbe;
  }

  // ------------------------------------------------------------------------

  setMeshColor(r, g, b) {
    if (this.meshColor[0] !== r && this.meshColor[1] !== g && this.meshColor[2] !== b) {
      this.meshColor = [r, g, b];
      this.update();
    }
  }

  // ------------------------------------------------------------------------

  getMeshColor() {
    return this.meshColor;
  }

  // ------------------------------------------------------------------------

  updateLayerVisibility(name, visible) {
    var array = this.layers,
      count = array.length;

    while (count) {
      count -= 1;
      if (array[count].name === name) {
        array[count].active = visible;
        this.update();
        if (this.timeProbe.enabled) {
          this.timeProbe.forceUpdate = true;
          this.getTimeChart();
        }
        return;
      }
    }
  }

  // ------------------------------------------------------------------------

  updateMaskLayerVisibility(name, visible) {
    var array = this.layers,
      count = array.length;

    while (count) {
      count -= 1;
      if (array[count].name === name) {
        array[count].meshActive = visible;
        this.update();
        return;
      }
    }
  }

  // ------------------------------------------------------------------------

  updateLayerColorBy(name, arrayName) {
    var array = this.layers,
      count = array.length;

    while (count) {
      count -= 1;
      if (array[count].name === name) {
        array[count].array = arrayName;
        this.update();
        if (this.timeProbe.enabled) {
          this.getTimeChart();
        }
        return;
      }
    }
  }
}
