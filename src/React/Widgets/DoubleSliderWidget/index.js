import equals from 'mout/src/array/equals';
import React from 'react';
import style from 'PVWStyle/ReactWidgets/DoubleSliderWidget.mcss';

export default React.createClass({

  displayName: 'DoubleSliderWidget',

  propTypes: {
    max: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    min: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    size: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
    value: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  },

  getDefaultProps() {
    return {
      max: 1,
      min: 0,
      size: 100,
      name: 'DoubleValue',
    };
  },

  getInitialState() {
    return {
      txtValue: null,
      value: this.props.value ? this.props.value : 0.5 * (this.props.max + this.props.min),
      max: this.props.max,
      min: this.props.min,
    };
  },

  componentWillReceiveProps(nextProps) {
    var previous = this.props,
      next = nextProps;

    if (!equals(previous, next)) {
      this.setState({
        value: next.value ? next.value : 0.5 * (next.max + next.min),
      });
    }
  },

  textInput(e) {
    const value = Number(e.target.value);
    if (!Number.isNaN(value) && e.target.value.length > 0) {
      this.setState({ value, txtValue: e.target.value });
      if (this.props.onChange) {
        this.props.onChange(this.props.name, value);
      }
    } else {
      this.setState({
        txtValue: e.target.value,
      });
    }
  },

  sliderInput(e) {
    const min = Number(this.props.min),
      max = Number(this.props.max),
      delta = max - min,
      value = ((delta * Number(e.target.value)) / Number(this.props.size)) + min;

    this.setState({ value, txtValue: null });
    if (this.props.onChange) {
      this.props.onChange(this.props.name, value);
    }
  },

  render() {
    var [min, max, size, value] = [this.props.min, this.props.max, this.props.size, this.state.value];

    return (
      <div className={style.container}>
        <input
          type="range"
          className={style.rangeInput}
          value={Math.floor(((value - min) / (max - min)) * size)}
          onChange={this.sliderInput}
          min="0" max={size}
        />
        <input
          type="text"
          className={style.textInput}
          pattern="-*[0-9]*.*[0-9]*"
          value={this.state.txtValue !== null ? this.state.txtValue : this.state.value}
          onChange={this.textInput}
        />
      </div>);
  },
});
