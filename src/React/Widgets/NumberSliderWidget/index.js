import React from 'react';
import style from 'PVWStyle/ReactWidgets/NumberSliderWidget.mcss';

export default React.createClass({

  displayName: 'NumberSliderWidget',

  propTypes: {
    max: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    min: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    step: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    value: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  },

  getDefaultProps() {
    return {
      max: 100,
      min: 0,
      step: 1,
      value: 50,
    };
  },

  getInitialState() {
    return {
      max: this.props.max,
      min: this.props.min,
      step: this.props.step,
      value: this.props.value,
    };
  },

  valInput(e) {
    this.setState({ value: e.target.value });
    if (this.props.onChange) {
      if (this.props.name) {
        e.target.name = this.props.name;
      }
      this.props.onChange(e);
    }
  },

  value(newVal) {
    if (newVal === null || newVal === undefined) {
      return this.state.value;
    }

    const value = Math.max(this.state.min, Math.min(newVal, this.state.max));
    this.setState({ value });
    return value;
  },

  render() {
    var [min, max] = [this.props.min, this.props.max];

    return (
      <div className={ style.container }>
        <input type="range"
          className={ style.range }
          value={this.props.value}
          onChange={this.valInput}
          max={max} min={min}
        />
        <input type="number"
          className={ style.text }
          value={this.props.value}
          onChange={this.valInput}
          max={max} min={min}
        />
      </div>);
  },
});
