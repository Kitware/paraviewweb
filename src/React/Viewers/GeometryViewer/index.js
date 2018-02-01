import React from 'react';
import PropTypes from 'prop-types';

import AbstractViewerMenu from '../AbstractViewerMenu';
import GeometryRenderer from '../../Renderers/GeometryRenderer';

export default function GeometryViewer(props) {
  let controlWidgets = [];

  // Add menuAddOn if any at the top
  if (props.menuAddOn) {
    controlWidgets = props.menuAddOn.concat(controlWidgets);
  }

  return (
    <AbstractViewerMenu
      queryDataModel={props.queryDataModel}
      geometryBuilder={props.geometryBuilder}
      renderer="GeometryRenderer"
      rendererClass={GeometryRenderer}
      config={props.config || {}}
    >
      {controlWidgets}
    </AbstractViewerMenu>
  );
}

GeometryViewer.propTypes = {
  config: PropTypes.object,
  geometryBuilder: PropTypes.object.isRequired,
  menuAddOn: PropTypes.array,
  queryDataModel: PropTypes.object.isRequired,
};

GeometryViewer.defaultProps = {
  config: {},
  menuAddOn: undefined,
};
