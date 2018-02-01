import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/TogglePanelWidget.mcss';

export default class TogglePanelWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      panelVisible: props.panelVisible,
    };

    // Bind callback
    this.togglePanel = this.togglePanel.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.enabled) {
      this.setState({ enabled: nextProps.value });
    }
    if (nextProps.panelVisible !== this.state.panelVisible) {
      this.setState({ panelVisible: nextProps.panelVisible });
    }
  }

  togglePanel() {
    const panelVisible = !this.state.panelVisible;
    this.setState({ panelVisible });
  }

  render() {
    const buttonAnchor = this.props.anchor.join(' ');
    const panelAnchor = this.props.position.join(' ');

    return (
      <div
        className={style.container}
        style={{
          width: this.props.size.button[0],
          height: this.props.size.button[1],
          lineHeight: this.props.size.button[1],
        }}
      >
        <span
          className={
            this.state.panelVisible ? style.panelVisible : style.panelHidden
          }
          style={{
            width: this.props.size.button[0],
            height: this.props.size.button[1],
            lineHeight: this.props.size.button[1],
          }}
          onClick={this.togglePanel}
        />
        <div className={[style.button, buttonAnchor].join(' ')}>
          <div
            className={[style.content, panelAnchor].join(' ')}
            style={{
              display: this.state.panelVisible ? 'block' : 'none',
              width: this.props.size.panel[0],
            }}
          >
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

TogglePanelWidget.propTypes = {
  anchor: PropTypes.array,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  panelVisible: PropTypes.bool,
  position: PropTypes.array,
  size: PropTypes.object,
  value: PropTypes.bool,
};

TogglePanelWidget.defaultProps = {
  anchor: ['top', 'right'],
  children: [],
  panelVisible: false,
  position: ['top', 'left'],
  size: {
    button: ['2em', '2em'],
    panel: ['400px'],
  },
  value: false,
};
