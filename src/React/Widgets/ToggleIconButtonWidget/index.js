import React from 'react';
import style from 'PVWStyle/ReactWidgets/ToggleIconButtonWidget.mcss';

export default React.createClass({

  displayName: 'ToggleIconButtonWidget',

  propTypes: {
    alwaysOn: React.PropTypes.bool,
    className: React.PropTypes.string,
    icon: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    toggle: React.PropTypes.bool,
    value: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      className: '',
      value: true,
      icon: 'fa-sun-o',
      toggle: true,
      name: 'toggle-button',
    };
  },

  getInitialState() {
    return {
      enabled: this.props.value,
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.enabled) {
      this.setState({ enabled: nextProps.value });
    }
  },

  buttonClicked() {
    var enabled = this.props.toggle ? !this.state.enabled : this.state.enabled;
    if (this.props.onChange) {
      this.props.onChange(enabled, this.props.name);
    }
    if (this.props.toggle) {
      this.setState({ enabled });
    }
  },

  render() {
    var classList = [this.props.icon, this.props.className];
    classList.push((this.state.enabled || this.props.alwaysOn) ? style.enabledButton : style.disabledButton);
    return <i className={ classList.join(' ') } onClick={this.buttonClicked} />;
  },
});
