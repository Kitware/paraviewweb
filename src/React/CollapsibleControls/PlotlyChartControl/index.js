import React from 'react';

import CollapsibleWidget from '../../Widgets/CollapsibleWidget';
import DropDownWidget    from '../../Widgets/DropDownWidget';

import Histogram   from './Histogram';
import Histogram2D from './Histogram2D';
import Scatter3D   from './Scatter3D';
import PieChart    from './PieChart';

const types = {
  Histogram,
  Histogram2D,
  Scatter3D,
  PieChart,
};

export default React.createClass({

  displayName: 'PlotlyChartControl',

  propTypes: {
    model: React.PropTypes.object.isRequired,
  },

  updateChartType(chartType) {
    this.props.model.updateState({
      chartType,
    });
    this.forceUpdate();
  },

  updateChartData(data) {
    this.props.model.updateState(data);
    this.forceUpdate();
  },

  render() {
    const arrays = this.props.model.getArrays();
    const chartState = this.props.model.getState();

    return (
      <CollapsibleWidget
        title="Chart"
        activeSubTitle
        subtitle={
          <DropDownWidget
            field={chartState.chartType}
            fields={Object.keys(types)}
            onChange={this.updateChartType}
          />
        }
      >
        {React.createElement(types[chartState.chartType], { chartState, arrays, onChange: this.updateChartData })}
      </CollapsibleWidget>
    );
  },
});
