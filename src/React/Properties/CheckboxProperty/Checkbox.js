import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/CheckboxProperty.mcss';

export default class Checkbox extends React.Component {
  constructor(props) {
    super(props);

    // Callback binding
    this.valueChange = this.valueChange.bind(this);
  }

  valueChange(e) {
    if (this.props.onChange) {
      if (this.props.idx >= 0) {
        this.props.onChange(this.props.idx, e.target.checked);
      } else {
        this.props.onChange(null, e.target.checked);
      }
    }
  }

  render() {
    return (
      <div>
        <label className={style.label}>{this.props.label}</label>
        <input
          className={style.input}
          type="checkbox"
          checked={this.props.value}
          onChange={this.valueChange}
        />
      </div>
    );
  }
}

Checkbox.propTypes = {
  idx: PropTypes.number.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.bool,
};

Checkbox.defaultProps = {
  value: false,
  label: '',
};
