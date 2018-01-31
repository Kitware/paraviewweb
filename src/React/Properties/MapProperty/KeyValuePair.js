import React from 'react';
import PropTypes from 'prop-types';
import style from 'PVWStyle/ReactProperties/MapProperty.mcss';

export default class KeyValuePair extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.removeItem = this.removeItem.bind(this);
    this.valueChange = this.valueChange.bind(this);
  }

  removeItem(e) {
    if (this.props.onChange) {
      if (this.props.idx >= 0) {
        this.props.onChange(this.props.idx);
      }
    }
  }

  valueChange(e) {
    const value = e.target.value;
    const name = e.target.name;

    if (this.props.onChange) {
      if (this.props.idx >= 0) {
        this.props.onChange(this.props.idx, name, value);
      } else {
        this.props.onChange(null, name, value);
      }
    }
  }

  render() {
    return (
      <tr>
        <td className={style.inputColumn}>
          <input
            className={style.input}
            name="name"
            type="text"
            value={this.props.value.name}
            onChange={this.valueChange}
          />
        </td>
        <td className={style.inputColumn}>
          <input
            className={style.input}
            name="value"
            type="text"
            value={this.props.value.value}
            onChange={this.valueChange}
          />
        </td>
        <td className={style.actionColumn}>
          <i className={style.deleteButton} onClick={this.removeItem} />
        </td>
      </tr>
    );
  }
}

KeyValuePair.propTypes = {
  idx: PropTypes.number,
  label: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.object,
};

KeyValuePair.defaultProps = {
  label: '',
};
