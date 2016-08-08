import React from 'react';
import style from 'PVWStyle/ReactProperties/CheckboxProperty.mcss';

export default React.createClass({

  displayName: 'Checkbox',

  propTypes: {
    idx: React.PropTypes.number,
    label: React.PropTypes.string,
    onChange: React.PropTypes.func,
    value: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      value: false,
      label: '',
    };
  },

  valueChange(e) {
    if (this.props.onChange) {
      if (this.props.idx >= 0) {
        this.props.onChange(this.props.idx, e.target.checked);
      } else {
        this.props.onChange(null, e.target.checked);
      }
    }
  },

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
      </div>);
  },
});
