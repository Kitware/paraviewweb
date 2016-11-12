import React from 'react';

export default React.createClass({

  displayName: 'SelectWidget',

  propTypes: {
    field: React.PropTypes.string,
    fields: React.PropTypes.array,
    onChange: React.PropTypes.func,
    name: React.PropTypes.string,
  },

  getInitialState() {
    return {
      field: this.props.field || this.props.fields[0],
    };
  },

  onChange(e) {
    this.setField(e.target.value);
  },

  getField() {
    return this.state.field;
  },

  setField(value) {
    this.setState({ field: value });
    if (this.props.onChange) this.props.onChange(value, this.props.name);
  },

  render() {
    return (
      <select value={this.state.field} onChange={this.onChange}>
        {this.props.fields.map((f, i) =>
          <option key={`opt${i}`} value={f}>{f}</option>
        )}
      </select>
    );
  },

});
