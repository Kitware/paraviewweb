import Monologue   from 'monologue.js';

import '../../../React/CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const DATA_READY_TOPIC = 'data-ready';

export default class CDFChartBuilder {
  constructor(queryDataModel) {
    this.queryDataModel = queryDataModel;
    this.cdf = null;
    this.totalCount = 100;

    // Handle data fetching
    if (this.queryDataModel) {
      this.totalCount = this.queryDataModel.originalData.metadata.totalCount || 100;
      this.queryDataModel.onDataChange((data, envelope) => {
        if (data.cdf) {
          this.cdf = new Float32Array(data.cdf.data);
          this.updateLineChart();
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

  updateLineChart() {
    const traces = [];
    // Generate CDF
    const trace1 = { name: 'CDF', mode: 'lines', x: [], y: [] };
    const yStep = 1 / (this.cdf.length - 1);
    this.cdf.forEach((v, idx, array) => {
      trace1.x.push(v);
      trace1.y.push(idx * yStep);
    });
    traces.push(trace1);
    // Generate PDF
    const trace2 = { name: 'PDF', mode: 'lines', x: [], y: [] };
    const size = this.cdf.length;
    let nbDuplicates = 1;
    for (let i = 1; i < size; i++) {
      if (this.cdf[i] === this.cdf[i - 1]) {
        nbDuplicates += 1;
      } else {
        const yValue = nbDuplicates / (this.cdf[i] - this.cdf[i - 1]);
        nbDuplicates = 1;
        trace2.x.push(this.cdf[i]);
        trace2.y.push(yValue);
      }
    }
    // normalize
    const norm = Math.max(...trace2.y);
    trace2.y = trace2.y.map(v => v / norm);
    traces.push(trace2);
    // Publish data
    this.dataReady({
      traces,
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
Monologue.mixInto(CDFChartBuilder);
