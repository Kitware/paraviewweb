import React from 'react';
import style from 'PVWStyle/ReactWidgets/TextInputWidget.mcss';

export default React.createClass({

  displayName: 'TextInputWidget',

  propTypes: {
    className: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    value: React.PropTypes.string,
    maxWidth: React.PropTypes.string,
    icon: React.PropTypes.string,
  },

  getDefaultProps() {
    return {
      value: '',
      className: '',
      icon: `${style.checkIcon}`,
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
    if (!this.state.editing) return;
    this.setState({ editing: false });

    if (!this.props.onChange) return;
    if (this.props.name) {
      this.props.onChange(this.state.valueRep, this.props.name);
    } else {
      this.props.onChange(this.state.valueRep);
    }
  },

  handleKeyUp(e) {
    if (!this.textInput) return;
    if (e.key === 'Enter' || e.key === 'Return') {
      this.textInput.blur();
    } else if (e.key === 'Escape') {
      this.setState({ valueRep: this.props.value });
    }
  },

  render() {
    const inlineStyle = this.props.maxWidth ? { maxWidth: this.props.maxWidth } : {};
    return (
      <div className={[style.container, this.props.className].join(' ')}>
        <input
          className={style.entry}
          type="text"
          value={this.state.editing ? this.state.valueRep : this.props.value}
          style={inlineStyle}
          onChange={this.valueChange}
          onBlur={this.endEditing}
          onKeyUp={this.handleKeyUp}
          ref={(c) => { this.textInput = c; }}
        />
        { // Use the check icon by default, but allow customization, for example: fa-search
        }
        <i className={[this.state.editing ? style.editingButton : style.button, this.props.icon].join(' ')} />
      </div>);
  },
});
