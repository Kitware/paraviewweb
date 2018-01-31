import React from 'react';
import PropTypes from 'prop-types';

export default class NumberInputWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      valueRep: props.value,
    };

    // Bind callback
    this.valueChange = this.valueChange.bind(this);
    this.endEditing = this.endEditing.bind(this);
  }

  getValue() {
    const propVal = parseFloat(this.newVal);
    if (!isNaN(propVal)) {
      return propVal;
    }
    return undefined;
  }

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
  }

  endEditing() {
    this.setState({ editing: false });
  }

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
      />
    );
  }
}

NumberInputWidget.propTypes = {
  className: PropTypes.string,
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  name: PropTypes.string,
  onChange: PropTypes.func,
  step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

NumberInputWidget.defaultProps = {
  className: '',
  step: 1,
  value: 0,
  classes: [],
};
