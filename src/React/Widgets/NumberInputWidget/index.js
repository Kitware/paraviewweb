import React from 'react';

export default React.createClass({

  displayName: 'NumberInputWidget',

  propTypes: {
    className: React.PropTypes.string,
    max: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    min: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    step: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    value: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  },

  getDefaultProps() {
    return {
      className: '',
      step: 1,
      value: 0,
      classes: [],
    };
  },

  getInitialState() {
    return {
      editing: false,
      valueRep: this.props.value,
    };
  },

  getValue() {
    const propVal = parseFloat(this.newVal);
    if (!isNaN(propVal)) {
      return propVal;
    }
    return undefined;
  },

  valueChange(e) {
    this.newVal = e.target.value;
    this.setState({ editing: true, valueRep: this.newVal });

    const propVal = parseFloat(this.newVal);
    if (!isNaN(propVal) && this.props.onChange) {
      if (this.props.name) {
        this.props.onChange(propVal, this.props.name);
      } else {
        this.props.onChange(propVal);
      }
    }
  },

  endEditing() {
    this.setState({ editing: false });
  },

  render() {
    return (
      <input
        className={this.props.className}
        type="number"
        min={this.props.min}
        max={this.props.max}
        step={this.props.step}
        value={this.state.editing ? this.state.valueRep : this.props.value}
        onChange={this.valueChange}
        onBlur={this.endEditing}
      />);
  },
});
