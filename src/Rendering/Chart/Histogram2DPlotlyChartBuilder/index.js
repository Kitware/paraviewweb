import Monologue   from  'monologue.js';
import Surface3D   from './Surface3D';
import Scatter     from './Scatter';

const chartFactory = {
  Surface3D,
  Scatter,
};

const DATA_READY_TOPIC = 'data-ready';

export default class Histogram2DPlotlyChartBuilder {
  constructor(queryDataModel) {
    this.queryDataModel = queryDataModel;
    this.availableChartTypes = Object.keys(chartFactory);
    this.chartState = {
      chartType: this.availableChartTypes[1],
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
    if (this.chartState.chartType && this.histogram) {
      const builder = chartFactory[this.chartState.chartType];
      const plotData = builder(this.chartState, this.histogram);
      this.chartState.forceNewPlot = false;
      if (plotData) {
        this.dataReady(plotData);
      }
    }
  }

  // ------------------------------------------------------------------------

  updateState(state) {
    if (state) {
      this.chartState = Object.assign(this.chartState, state);
    }

    this.buildChart();
  }

  // ------------------------------------------------------------------------

  getState() {
    return this.chartState;
  }

  // ------------------------------------------------------------------------

  setHistogram(histogram) {
    // we need a new plot if the axes change, as opposed to just the data.
    if (!this.histogram ||
      this.histogram.x.name !== histogram.x.name ||
      this.histogram.x.extent !== histogram.x.extent ||
      this.histogram.y.name !== histogram.y.name ||
      this.histogram.y.extent !== histogram.y.extent) {
      this.chartState.forceNewPlot = true;
    }
    this.histogram = histogram;
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
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(Histogram2DPlotlyChartBuilder);
