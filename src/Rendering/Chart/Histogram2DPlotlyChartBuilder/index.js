import Monologue from 'monologue.js';
import HistXYZ from './HistXYZ';
import Scatter from './Scatter';
import ScatterXY from './ScatterXY';

import '../../../React/CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const defaultConfig = {
  scrollZoom: true,
  displayModeBar: true,
  displaylogo: false,
  showLink: false,
  modeBarButtonsToRemove: ['sendDataToCloud'],
};
const chartFactory = {
  Contour: { builder: HistXYZ, type: 'contour', data: 'histogram' },
  Heatmap: { builder: HistXYZ, type: 'heatmap', data: 'histogram' },
  Scatter: { builder: Scatter, type: 'scatter', data: 'histogram' },
  ScatterXY: { builder: ScatterXY, type: 'scatter', data: 'scatter' },
  ScatterXYContour: {
    builder: ScatterXY,
    type: 'histogram2dcontour',
    data: 'scatter',
  },
  Surface3D: { builder: HistXYZ, type: 'surface', data: 'histogram' },
  Trend: {
    builder: (chartState, data) => {
      if (data) data.config = data.config || defaultConfig;
      return data;
    },
    type: 'custom',
    data: 'plot',
  },
};

const DATA_READY_TOPIC = 'data-ready';

export default class Histogram2DPlotlyChartBuilder {
  constructor(queryDataModel) {
    this.queryDataModel = queryDataModel;
    this.availableChartTypes = Object.keys(chartFactory);
    this.chartState = {
      chartType: this.availableChartTypes[1],
      colormap: 'Portland',
    };

    // Handle data fetching
    if (this.queryDataModel) {
      this.queryDataModel.onDataChange((data, envelope) => {
        this.histogram = data.histogram2D.data;

        this.updateState();
      });
      this.queryDataModel.onStateChange((event) => {
        if (event.name === 'chartType') {
          this.chartState.chartType = event.value;
          this.chartState.forceNewPlot = true;
          this.updateState();
        }
      });
    }

    this.controlWidgets = [];
    if (this.queryDataModel) {
      this.controlWidgets.push({
        name: 'QueryDataModelWidget',
        queryDataModel,
      });
    }
  }

  // ------------------------------------------------------------------------

  buildChart() {
    if (this.chartState.chartType && (this.histogram || this.scatter)) {
      const builder = chartFactory[this.chartState.chartType].builder;
      const typeString = chartFactory[this.chartState.chartType].type;
      const dataType = chartFactory[this.chartState.chartType].data;
      const plotData = builder(this.chartState, this[dataType], typeString);
      this.chartState.forceNewPlot = false;
      if (plotData) {
        this.dataReady(plotData);
      }
    }
  }

  // ------------------------------------------------------------------------

  updateState(state, forceNewPlot) {
    if (state) {
      this.chartState = Object.assign(this.chartState, state);
      if (forceNewPlot) this.chartState.forceNewPlot = true;
    }

    this.buildChart();
  }

  // ------------------------------------------------------------------------

  getState() {
    return this.chartState;
  }

  // ------------------------------------------------------------------------
  getHistogram() {
    return this.histogram;
  }
  getScatter() {
    return this.scatter;
  }

  setHistogram(histogram) {
    // we need a new plot if the axes change, as opposed to just the data.
    if (
      !this.histogram ||
      this.histogram.x.name !== histogram.x.name ||
      this.histogram.x.extent !== histogram.x.extent ||
      this.histogram.y.name !== histogram.y.name ||
      this.histogram.y.extent !== histogram.y.extent
    ) {
      this.chartState.forceNewPlot = true;
    }
    this.histogram = histogram;
    this.buildChart();
  }
  setScatter(scatter) {
    // we need a new plot if the axes change, as opposed to just the data.
    if (
      !this.scatter ||
      this.scatter[0].name !== scatter[0].name ||
      this.scatter[0].extent !== scatter[0].extent ||
      this.scatter[1].name !== scatter[1].name ||
      this.scatter[1].extent !== scatter[1].extent
    ) {
      this.chartState.forceNewPlot = true;
    }
    this.scatter = scatter;
    this.buildChart();
  }
  setPlot(plot) {
    this.chartState.forceNewPlot = true;
    this.plot = plot;
    this.buildChart();
  }

  // ------------------------------------------------------------------------

  onDataReady(callback) {
    return this.on(DATA_READY_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  dataReady(readyData) {
    this.emit(DATA_READY_TOPIC, readyData);
  }

  // ------------------------------------------------------------------------

  // Method meant to be used with the WidgetFactory
  getControlWidgets() {
    return this.controlWidgets;
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      queryDataModel: this.queryDataModel,
    };
  }

  getAvailableChartTypes() {
    return this.availableChartTypes;
  }

  getChartType() {
    return this.chartState.chartType;
  }
  getDataType() {
    return chartFactory[this.chartState.chartType].data;
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(Histogram2DPlotlyChartBuilder);
