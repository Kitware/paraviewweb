import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ScatterPlotCameraControl.mcss';
import InlineToggleButtonWidget from '../InlineToggleButtonWidget';

const SELECTED_COLOR = '#cdcdcd';
const DEFAULT_COLOR = '#fff';

export default class ScatterPlotCameraControl extends React.Component {
  constructor(props) {
    super(props);

    // Auto bind method
    this.changeProjection = (item) => {
      const mode = item.label;
      props.manager.updateProjection(mode, props.name);

      // The projection has changed
      this.forceUpdate();
    };

    // Rescale axis...
    this.resetCamera = () => {
      // force a rescale/reset.
      this.props.manager.resetCamera(props.name, true);
    };

    // Action mapping
    this.onAction = (item) => {
      if (item.action) {
        this[item.action](item);
      }
    };
  }

  render() {
    if (!this.props.manager) {
      return null;
    }
    const activeProjection = this.props.manager.getProjection();

    /* eslint-disable react/jsx-curly-spacing */
    return (
      <div className={style.container} title="ScatterPlot Camera">
        <InlineToggleButtonWidget
          activeColor={DEFAULT_COLOR}
          defaultColor={DEFAULT_COLOR}
          height="21px"
          options={[
            { action: 'resetCamera', icon: style.resetCameraButton },
            { action: 'changeProjection', label: 'X' },
            { action: 'changeProjection', label: 'Y' },
            { action: 'changeProjection', label: 'Z' },
          ]}
          onChange={this.onAction}
        />
        <InlineToggleButtonWidget
          active={['2D', '3D'].indexOf(activeProjection)}
          activeColor={SELECTED_COLOR}
          defaultColor={DEFAULT_COLOR}
          height="21px"
          options={[
            { label: '2D', action: 'changeProjection' },
            { label: '3D', action: 'changeProjection' },
          ]}
          onChange={this.onAction}
        />
      </div>
    );
  }
}

ScatterPlotCameraControl.propTypes = {
  manager: PropTypes.object,
  name: PropTypes.string,
};

ScatterPlotCameraControl.defaultProps = {
  manager: undefined,
  name: undefined,
};
