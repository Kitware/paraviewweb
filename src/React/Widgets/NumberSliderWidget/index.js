import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/NumberSliderWidget.mcss';

export default class NumberSliderWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      max: props.max,
      min: props.min,
      value: props.value,
    };

    // Bind callback
    this.valInput = this.valInput.bind(this);
    this.value = this.value.bind(this);
  }

  valInput(e) {
    this.setState({ value: e.target.value });
    if (this.props.onChange) {
      if (this.props.name) {
        e.target.name = this.props.name;
      }
      this.props.onChange(e);
    }
  }

  value(newVal) {
    if (newVal === null || newVal === undefined) {
      return this.state.value;
    }

    const value = Math.max(this.state.min, Math.min(newVal, this.state.max));
    this.setState({ value });
    return value;
  }

  render() {
    const [min, max] = [this.props.min, this.props.max];

    return (
      <div className={style.container}>
        <input
          type="range"
          className={style.range}
          value={this.props.value}
          onChange={this.valInput}
          max={max}
          min={min}
          step={this.props.step || 'any'}
        />
        <input
          type="number"
          className={style.text}
          value={this.props.value}
          onChange={this.valInput}
          max={max}
          min={min}
          step="any"
        />
      </div>
    );
  }
}

NumberSliderWidget.propTypes = {
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  name: PropTypes.string,
  onChange: PropTypes.func,
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

NumberSliderWidget.defaultProps = {
  max: 100,
  min: 0,
  step: 1,
  value: 50,
  name: '',
  onChange: undefined,
};
