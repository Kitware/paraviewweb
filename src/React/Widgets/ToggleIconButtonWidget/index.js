import React     from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ToggleIconButtonWidget.mcss';

export default class ToggleIconButtonWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: props.value,
    };

    // Callback binding
    this.buttonClicked = this.buttonClicked.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.enabled) {
      this.setState({ enabled: nextProps.value });
    }
  }

  buttonClicked() {
    var enabled = this.props.toggle ? !this.state.enabled : this.state.enabled;
    if (this.props.onChange) {
      this.props.onChange(enabled, this.props.name);
    }
    if (this.props.toggle) {
      this.setState({ enabled });
    }
  }

  render() {
    const classList = [this.props.className];
    const enabled = this.state.enabled || this.props.alwaysOn;
    if (this.props.iconDisabled) {
      classList.push(enabled ? this.props.icon : this.props.iconDisabled);
      classList.push(style.enabledButton);
    } else {
      classList.push(this.props.icon);
      classList.push(enabled ? style.enabledButton : style.disabledButton);
    }
    return <i className={classList.join(' ')} onClick={this.buttonClicked} />;
  }
}

ToggleIconButtonWidget.propTypes = {
  alwaysOn: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.string,
  iconDisabled: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  toggle: PropTypes.bool,
  value: PropTypes.bool,
};

ToggleIconButtonWidget.defaultProps = {
  className: '',
  value: true,
  icon: 'fa-sun-o',
  toggle: true,
  name: 'toggle-button',
};
