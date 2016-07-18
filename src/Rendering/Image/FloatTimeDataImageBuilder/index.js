import Monologue from 'monologue.js';
import LineChartPainter from '../../Painter/LineChartPainter';

const IMAGE_READY_TOPIC = 'image-ready';
const CHANGE_TOPIC = 'FloatTimeDataImageBuilder.change';

function buildListenerWrapper(floatTimeDataImageBuilder) {
  const { imageBuilder, probeManager } = floatTimeDataImageBuilder;
  const listener = imageBuilder.getListeners();
  const myListener = {};

  ['drag'].forEach(name => {
    myListener[name] = e => {
      if (!probeManager[name](e)) {
        return listener[name] ? listener[name](e) : false;
      }
      floatTimeDataImageBuilder.render();
      return true;
    };
  });

  // Attache remaining method if any
  Object.keys(listener).forEach(name => {
    if (!myListener[name]) {
      myListener[name] = listener[name];
    }
  });

  return myListener;
}

function updateRange(rangeToUpdate, range) {
  rangeToUpdate[0] = rangeToUpdate[0] < range[0] ? rangeToUpdate[0] : range[0];
  rangeToUpdate[1] = rangeToUpdate[1] > range[1] ? rangeToUpdate[1] : range[1];
}

function findProbeColor(probe, chartFields) {
  for (let i = 0; i < chartFields.length; ++i) {
    if (chartFields[i].name === probe.name && chartFields[i].color) {
      return chartFields[i].color;
    }
  }
  return 'black';
}

export default class FloatTimeDataImageBuilder {

  // ------------------------------------------------------------------------

  constructor(floatDataImageBuilder, timeProbeManager, painter) {
    this.imageBuilder = floatDataImageBuilder;
    this.probeManager = timeProbeManager;
    this.queryDataModel = floatDataImageBuilder.queryDataModel;
    this.listeners = buildListenerWrapper(this);
    this.activeView = 0;
    this.subscriptions = [];
    this.painter = painter || new LineChartPainter('');
    this.painter.setBackgroundColor('#ffffff');
    this.chartData = { fields: [], xRange: [0, 10] };

    // Hide probe panel
    this.imageBuilder.isMultiView = () => false;

    // Image ready interceptor
    this.subscriptions.push(this.imageBuilder.onImageReady((data, envelope) => {
      const { canvas, outputSize } = data;
      const ctx = canvas.getContext('2d');

      this.probeManager.setSize(outputSize[0], outputSize[1]);
      this.probeManager.getProbes().forEach(probe => {
        const rgbStr = findProbeColor(probe, this.chartData.fields);
        const ext = probe.getExtent();
        ctx.beginPath();
        ctx.lineWidth = '2';
        ctx.strokeStyle = rgbStr;
        ctx.rect(ext[0], ext[2], ext[1] - ext[0], ext[3] - ext[2]);
        ctx.stroke();
      });

      this.emit(IMAGE_READY_TOPIC, data);
    }));

    this.subscriptions.push(this.imageBuilder.onTimeDataReady(data => {
      this.updateChart(data);
    }));

    this.subscriptions.push(this.queryDataModel.onStateChange(data => {
      if (data.name === 'time') {
        this.painter.setMarkerLocation(this.queryDataModel.getIndex('time') / (this.queryDataModel.getSize('time') - 1));
        this.render();
        this.emit(CHANGE_TOPIC, this);
      }
    }));

    this.subscriptions.push(this.probeManager.onChange(() => {
      this.imageBuilder.fetchTimeData();
    }));
  }

  // ------------------------------------------------------------------------

  render() {
    this.imageBuilder.render();
  }

  update() {
    this.imageBuilder.update();
  }

  // ------------------------------------------------------------------------

  updateChart(data) {
    let arrayType = '';
    let field = '';
    let layerName = '';

    this.imageBuilder.layers.forEach((layer) => {
      if (layer.active) {
        arrayType = layer.type;
        field = layer.array;
        layerName = layer.name;
      }
    });

    const fieldName = `${layerName}_${field}`;
    const timeTypedArray = data.fullData.data.map(t => new window[arrayType](t[fieldName].data));

    this.chartData = Object.assign({}, { xRange: data.xRange });
    this.chartData.fields = this.probeManager.processTimeData(timeTypedArray);

    // Use same y scale for each field
    const sharedRange = [Number.MAX_VALUE, Number.MIN_VALUE];
    this.chartData.fields.forEach(f => {
      updateRange(sharedRange, f.range);
      f.range = sharedRange;
    });

    this.painter.updateData(this.chartData);
    this.render();

    this.emit(CHANGE_TOPIC, this);
  }

  // ------------------------------------------------------------------------

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  onModelChange(callback) {
    return this.on(CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  sortProbesByName() {
    this.probeManager.sortProbesByName();
    this.emit(CHANGE_TOPIC, this);
    this.imageBuilder.fetchTimeData();
  }

  // ------------------------------------------------------------------------

  destroy() {
    this.off();
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }

    this.imageBuilder.destroy();
    this.probeManager.destroy();
  }

  // ------------------------------------------------------------------------

  setActiveView(index) {
    this.activeView = index;
    this.emit(CHANGE_TOPIC, this);
    if (index !== 0) {
      this.imageBuilder.fetchTimeData();
    }
    this.render();
  }

  // ------------------------------------------------------------------------

  getActiveView() {
    return this.activeView;
  }

  // ------------------------------------------------------------------------

  enableProbe(probeName, enable = true) {
    this.probeManager.getProbes().forEach(probe => {
      if (probe.name === probeName) {
        probe.setActive(enable);
      }
    });
    this.chartData.fields.forEach(field => {
      if (field.name === probeName) {
        field.active = !!enable;
      }
    });
    this.emit(CHANGE_TOPIC, this);
    this.render();
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    var model = this,
      { lookupTableManager, queryDataModel } = this.getControlModels();
    return [
      {
        name: 'TimeFloatImageControl',
        model,
      }, {
        name: 'LookupTableManagerWidget',
        lookupTableManager,
      }, {
        name: 'QueryDataModelWidget',
        queryDataModel,
      },
    ];
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return this.imageBuilder.getControlModels();
  }

  // ------------------------------------------------------------------------

  getListeners() {
    return this.listeners;
  }

  // ------------------------------------------------------------------------

  setRenderer(renderer) {
    this.renderer = renderer;

    this.subscriptions.push(renderer.onDrawDone(rComponent => {
      if (this.activeView > 0) {
        if (rComponent && rComponent.getRenderingCanvas && this.painter.isReady()) {
          const canvasRenderer = rComponent.getRenderingCanvas();
          const { width, height } = canvasRenderer;
          const ctxRenderer = canvasRenderer.getContext('2d');
          const offset = 5;
          const location = { x: offset, y: Number(height) / 2 + offset, width: Number(width) / 2 - (2 * offset), height: Number(height) / 2 - (2 * offset) };
          ctxRenderer.fillStyle = '#ffffff';
          ctxRenderer.fillRect(location.x - 1, location.y - 1, location.width + 2, location.height + 2);
          this.painter.paint(ctxRenderer, location);
          ctxRenderer.strokeStyle = '#ccc';
          ctxRenderer.rect(location.x, location.y, location.width, location.height);
          ctxRenderer.stroke();
        }
      }
    }));
  }
}

Monologue.mixInto(FloatTimeDataImageBuilder);
