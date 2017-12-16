import React from 'react';
import PropTypes from 'prop-types';

import equals from 'mout/src/array/equals';

import style from 'PVWStyle/ReactWidgets/DoubleSliderWidget.mcss';

export default class DoubleSliderWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      txtValue: null,
      value: props.value ? props.value : 0.5 * (props.max + props.min),
      max: props.max,
      min: props.min,
    };

    // Bind callback
    this.textInput = this.textInput.bind(this);
    this.sliderInput = this.sliderInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const previous = this.props;
    const next = nextProps;

    if (!equals(previous, next)) {
      this.setState({
        value: next.value ? next.value : 0.5 * (next.max + next.min),
      });
    }
  }

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
  }

  sliderInput(e) {
    const min = Number(this.props.min),
      max = Number(this.props.max),
      delta = max - min,
      value = ((delta * Number(e.target.value)) / Number(this.props.size)) + min;

    this.setState({ value, txtValue: null });
    if (this.props.onChange) {
      this.props.onChange(this.props.name, value);
    }
  }

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
  }
}

DoubleSliderWidget.propTypes = {
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  name: PropTypes.string,
  onChange: PropTypes.func,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

DoubleSliderWidget.defaultProps = {
  max: 1,
  min: 0,
  size: 100,
  name: 'DoubleValue',
};
