import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ToggleTools.mcss';

import ScatterPlotControl from '../../Widgets/ScatterPlotControl';
import OverlayWindow from '../../Containers/OverlayWindow';
import SvgIconWidget from '../../Widgets/SvgIconWidget';

import OverlayTitleBar from '../../Widgets/OverlayTitleBar';
import icon from '../../../../svg/Buttons/ScatterPlotControl.svg';

export default class ScatterPlotControlTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overlayVisible: props.overlayVisible,
    };

    this.title = 'ScatterPlot Controls';

    // Autobinding
    this.toggleOverlay = this.toggleOverlay.bind(this);
  }

  toggleOverlay() {
    const overlayVisible = !this.state.overlayVisible;
    if (overlayVisible) {
      this.props.onActiveWindow(this);
    }
    this.setState({ overlayVisible });
  }

  render() {
    return (
      <div className={style.container}>
        <div title={this.title}>
          <SvgIconWidget
            width={this.props.size}
            height={this.props.size}
            icon={icon}
            className={this.state.overlayVisible ? style.iconOff : style.iconOn}
            onClick={() => this.toggleOverlay()}
          />
        </div>
        <OverlayWindow
          title={
            <OverlayTitleBar
              title={this.title}
              onClose={() => this.toggleOverlay()}
            />
          }
          x={514}
          y={120}
          visible={this.state.overlayVisible}
          minContentWidth={460}
          minContentHeight={505}
          width={470}
          height={540}
          onActive={() => this.props.onActiveWindow(this)}
          front={this === this.props.activeWindow}
        >
          <ScatterPlotControl
            manager={this.props.scatterPlotManager}
            name={this.props.scatterPlotId}
            activeScores={this.props.activeScores}
            onActiveScoresChange={this.props.onActiveScoresChange}
          />
        </OverlayWindow>
      </div>
    );
  }
}

ScatterPlotControlTool.propTypes = {
  size: PropTypes.string,

  scatterPlotManager: PropTypes.object.isRequired,
  scatterPlotId: PropTypes.string.isRequired,

  activeScores: PropTypes.array.isRequired,
  onActiveScoresChange: PropTypes.func,

  activeWindow: PropTypes.object.isRequired,
  onActiveWindow: PropTypes.func.isRequired,
  overlayVisible: PropTypes.bool,
};

ScatterPlotControlTool.defaultProps = {
  overlayVisible: false,
  size: '35px',
  onActiveScoresChange: null,
};
