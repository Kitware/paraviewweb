import React     from 'react';
import PropTypes from 'prop-types';

import AbstractViewerMenu from '../AbstractViewerMenu';
import WidgetFactory      from '../../CollapsibleControls/CollapsibleControlFactory';

// import GeometryRenderer  from '../../Renderers/GeometryRenderer';
// import ImageRenderer     from '../../Renderers/ImageRenderer';
// import MultiViewRenderer from '../../Renderers/MultiLayoutRenderer';
import PlotlyRenderer       from '../../Renderers/PlotlyRenderer';

export default function ChartViewer(props) {
  let controlWidgets = WidgetFactory.getWidgets(props.chartBuilder);

  // Add menuAddOn if any at the top
  if (props.menuAddOn) {
    controlWidgets = props.menuAddOn.concat(controlWidgets);
  }

  return (
    <AbstractViewerMenu
      queryDataModel={props.queryDataModel}
      chartBuilder={props.chartBuilder}
      renderer="PlotlyRenderer"
      rendererClass={PlotlyRenderer}
      config={props.config || {}}
    >
      {controlWidgets}
    </AbstractViewerMenu>
  );
}

ChartViewer.propTypes = {
  config: PropTypes.object,
  chartBuilder: PropTypes.object.isRequired,
  menuAddOn: PropTypes.array,
  queryDataModel: PropTypes.object.isRequired,
  userData: PropTypes.object,
};

ChartViewer.defaultProps = {
  config: {},
};
