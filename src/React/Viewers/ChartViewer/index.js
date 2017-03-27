import React                from 'react';

import AbstractViewerMenu   from '../AbstractViewerMenu';
import WidgetFactory        from '../../CollapsibleControls/CollapsibleControlFactory';

// import GeometryRenderer  from '../../Renderers/GeometryRenderer';
// import ImageRenderer     from '../../Renderers/ImageRenderer';
// import MultiViewRenderer from '../../Renderers/MultiLayoutRenderer';
import PlotlyRenderer       from '../../Renderers/PlotlyRenderer';

export default React.createClass({

  displayName: 'ChartViewer',

  propTypes: {
    config: React.PropTypes.object,
    chartBuilder: React.PropTypes.object.isRequired,
    menuAddOn: React.PropTypes.array,
    queryDataModel: React.PropTypes.object.isRequired,
    userData: React.PropTypes.object,
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
        rendererClass={PlotlyRenderer}
        config={this.props.config || {}}
      >
        {controlWidgets}
      </AbstractViewerMenu>
    );
  },
});
