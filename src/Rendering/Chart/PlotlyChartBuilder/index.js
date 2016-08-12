import Monologue   from  'monologue.js';
import CSVReader   from  '../../../IO/Core/CSVReader';
import chartTypes  from './chartTypes.json';
import Histogram   from './Histogram';
import Histogram2D from './Histogram2D';
import Scatter3D   from './Scatter3D';
import PieChart    from './PieChart';

const chartFactory = {
  Histogram,
  Histogram2D,
  Scatter3D,
  PieChart,
};

const DATA_READY_TOPIC = 'data-ready';

export default class PlotlyChartBuilder {
  constructor(queryDataModel) {
    this.queryDataModel = queryDataModel;
    this.csvReader = null;
    this.currentChartInfo = null;
    this.availableChartTypes = Object.keys(chartTypes);
    this.chartState = {
      chartType: this.availableChartTypes[0],
    };

    // Handle data fetching
    if (this.queryDataModel) {
      this.queryDataModel.onDataChange((data, envelope) => {
        if (data.chart) {
          if (this.csvReader === null) {
            this.csvReader = new CSVReader(data.chart.data);
          } else {
            this.csvReader.setData(data.chart.data);
          }

          this.updateState();
        }
      });
    }

    this.controlWidgets = [];
    if (this.queryDataModel) {
      this.controlWidgets.push({
        name: 'PlotlyChartControl',
        model: this,
      });
      this.controlWidgets.push({
        name: 'QueryDataModelWidget',
        queryDataModel,
      });
    }
  }

  // ------------------------------------------------------------------------

  getArrays() {
    return this.queryDataModel.originalData.Chart.arrays;
  }

  // ------------------------------------------------------------------------

  buildChart() {
    if (this.chartState.chartType) {
      const builder = chartFactory[this.chartState.chartType];
      const dataArrays = this.queryDataModel.originalData.Chart.arrays;
      const traces = builder(this.chartState, this.csvReader, dataArrays);
      if (traces) {
        this.dataReady({
          forceNewPlot: this.chartState.forceNewPlot,
          traces,
        });
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

  setChartData(chartData, layout) {
    this.dataReady({
      forceNewPlot: false,
      traces: chartData,
      layout,
    });
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
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(PlotlyChartBuilder);
