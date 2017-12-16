import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/DropDownWidget.mcss';

export default class DropDownWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      field: props.field || props.fields[0],
    };

    // Bind callback
    this.setField = this.setField.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }

  getField(e) {
    return this.state.field;
  }

  setField(e) {
    this.setState({ field: e.target.innerHTML });
    this.props.onChange(e.target.innerHTML);
  }

  toggleDropdown() {
    this.setState({ open: !this.state.open });
  }

  render() {
    return (
      <div className={style.container} onClick={this.toggleDropdown}>
        {this.state.field}
        <ul className={this.state.open ? style.list : style.hidden}>
          {this.props.fields.map((v) => {
            // this pops up in there for some reason.
            if (v === '__internal') {
              return null;
            }

            if (v === this.state.field) {
              return <li className={style.selectedItem} key={v} onClick={this.setField}>{v}</li>;
            }

            return <li className={style.item} key={v} onClick={this.setField}>{v}</li>;
          })}
        </ul>
      </div>
    );
  }
}

DropDownWidget.propTypes = {
  field: PropTypes.string,
  fields: PropTypes.array,
  onChange: PropTypes.func,
};
