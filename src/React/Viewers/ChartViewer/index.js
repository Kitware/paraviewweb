import React                from 'react';

import AbstractViewerMenu   from '../AbstractViewerMenu';
import WidgetFactory        from '../../CollapsibleControls/CollapsibleControlFactory';

export default React.createClass({

  displayName: 'ChartViewer',

  propTypes: {
    config: React.PropTypes.object,
    chartBuilder: React.PropTypes.object.isRequired,
    menuAddOn: React.PropTypes.array,
    queryDataModel: React.PropTypes.object.isRequired,
  },

  getDefaultProps() {
    return {
      config: {},
    };
  },

  render() {
    var queryDataModel = this.props.queryDataModel,
      chartBuilder = this.props.chartBuilder,
      controlWidgets = WidgetFactory.getWidgets(chartBuilder);

    // Add menuAddOn if any at the top
    if (this.props.menuAddOn) {
      controlWidgets = this.props.menuAddOn.concat(controlWidgets);
    }

    return (
      <AbstractViewerMenu
        queryDataModel={queryDataModel}
        chartBuilder={chartBuilder}
        renderer="PlotlyRenderer"
        config={this.props.config || {}}
      >
        {controlWidgets}
      </AbstractViewerMenu>
    );
  },
});
