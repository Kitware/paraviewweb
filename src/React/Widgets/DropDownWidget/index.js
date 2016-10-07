import React from 'react';
import style from 'PVWStyle/ReactWidgets/DropDownWidget.mcss';

export default React.createClass({

  displayName: 'DropDownWidget',

  propTypes: {
    field: React.PropTypes.string,
    fields: React.PropTypes.array,
    onChange: React.PropTypes.func,
  },

  getInitialState() {
    return {
      open: false,
      field: this.props.field || this.props.fields[0],
    };
  },

  getField(e) {
    return this.state.field;
  },

  setField(e) {
    this.setState({ field: e.target.innerHTML });
    this.props.onChange(e.target.innerHTML);
  },

  toggleDropdown() {
    this.setState({ open: !this.state.open });
  },

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
  },

});
