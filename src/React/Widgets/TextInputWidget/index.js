import React from 'react';
import style from 'PVWStyle/ReactWidgets/TextInputWidget.mcss';

export default React.createClass({

  displayName: 'TextInputWidget',

  propTypes: {
    className: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    value: React.PropTypes.string,
  },

  getDefaultProps() {
    return {
      value: '',
      className: '',
    };
  },

  getInitialState() {
    return {
      editing: false,
      valueRep: this.props.value,
    };
  },

  valueChange(e) {
    var newVal = e.target.value;
    this.setState({ editing: true, valueRep: newVal });
  },

  endEditing() {
    this.setState({ editing: false });

    if (this.props.name) {
      this.props.onChange(this.state.valueRep, this.props.name);
    } else {
      this.props.onChange(this.state.valueRep);
    }
  },

  render() {
    return (
      <div className={[style.container, this.props.className].join(' ')}>
        <input
          className={style.entry}
          type="text"
          value={this.state.editing ? this.state.valueRep : this.props.value}
          onChange={this.valueChange}
          onBlur={this.endEditing}
        />
        <i className={this.state.editing ? style.editingButton : style.button} />
      </div>);
  },
});
