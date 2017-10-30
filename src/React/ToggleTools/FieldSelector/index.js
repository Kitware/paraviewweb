import React from 'react';

import style from 'PVWStyle/ReactWidgets/ToggleTools.mcss';

import ComponentToReact   from '../../../Component/React/ComponentToReact';
import FieldSelector  from '../../../InfoViz/Native/FieldSelector';
import OverlayWindow  from '../../Containers/OverlayWindow';
import SvgIconWidget  from '../../Widgets/SvgIconWidget';

import OverlayTitleBar from '../../Widgets/OverlayTitleBar';
import icon from '../../../../svg/Buttons/FieldSelector.svg';

export default class FieldSelectorTool extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      overlayVisible: props.overlayVisible,
    };

    this.title = 'Parameters';

    // Autobinding
    this.toggleOverlay = this.toggleOverlay.bind(this);
  }

  componentWillMount() {
    this.component = FieldSelector.newInstance({ provider: this.props.provider });
  }

  componentWillUnmount() {
    this.component.destroy();
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
          y={80}
          visible={this.state.overlayVisible}
          minContentWidth={100}
          minContentHeight={100}
          width={470}
          height={300}
          onResize={() => this.component.resize()}
          onActive={() => this.props.onActiveWindow(this)}
          front={this === this.props.activeWindow}
        >
          <div style={{ overflow: 'auto', position: 'absolute', width: '100%', height: '100%' }}>
            <ComponentToReact className={style.fullSize} component={this.component} />
          </div>
        </OverlayWindow>
      </div>);
  }
}

FieldSelectorTool.propTypes = {
  provider: React.PropTypes.object,
  size: React.PropTypes.string,

  activeWindow: React.PropTypes.object,
  onActiveWindow: React.PropTypes.func,
  overlayVisible: React.PropTypes.bool,
};

FieldSelectorTool.defaultProps = {
  overlayVisible: false,
  size: '35px',
};
