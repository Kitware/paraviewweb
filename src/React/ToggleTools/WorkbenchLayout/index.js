import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ToggleTools.mcss';
import WorkbenchController from '../../../Component/React/WorkbenchController';
import OverlayWindow  from '../../Containers/OverlayWindow';
import SvgIconWidget  from '../../Widgets/SvgIconWidget';

import OverlayTitleBar from '../../Widgets/OverlayTitleBar';
import icon from '../../../../svg/Buttons/Layout.svg';

export default class WorkbenchLayoutTool extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      overlayVisible: false,
    };

    this.title = 'Workbench Layout';

    // Autobinding
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onViewportChange = this.onViewportChange.bind(this);
  }

  onLayoutChange(layout) {
    this.props.workbench.setLayout(layout);
    this.forceUpdate();
  }

  onViewportChange(index, instance) {
    this.props.workbench.setViewport(index, instance);
    this.forceUpdate();
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
          x={20}
          y={390}
          visible={this.state.overlayVisible}
          minContentWidth={290}
          minContentHeight={210}
          width={300}
          height={245}
          onActive={() => this.props.onActiveWindow(this)}
          front={this === this.props.activeWindow}
        >
          <WorkbenchController
            onLayoutChange={this.onLayoutChange}
            onViewportChange={this.onViewportChange}
            activeLayout={this.props.workbench.getLayout()}
            viewports={this.props.workbench.getViewportMapping()}
            count={this.props.workbench.getLayoutCount()}
          />
        </OverlayWindow>
      </div>);
  }
}

WorkbenchLayoutTool.propTypes = {
  provider: PropTypes.object,
  size: PropTypes.string,

  workbench: PropTypes.object,

  activeWindow: PropTypes.object,
  onActiveWindow: PropTypes.func,
};

WorkbenchLayoutTool.defaultProps = {
  size: '35px',
};
