import React    from 'react';
import convert  from '../../../Common/Misc/Convert';
import validate from '../../../Common/Misc/Validate';
import style    from 'PVWStyle/ReactProperties/CellProperty.mcss';

export default React.createClass({

    displayName: 'InputCell',

    propTypes: {
        domain: React.PropTypes.object,
        idx:    React.PropTypes.number.isRequired,
        label:  React.PropTypes.string,
        onChange: React.PropTypes.func,
        type:   React.PropTypes.string,
        value:  React.PropTypes.any,
    },

    getDefaultProps() {
        return {
            label: '',
            idx: 0,
            value: '',
            type: 'string',
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
        this.setState({editing: true, valueRep: newVal});

        if (validate[this.props.type](newVal)) {
            let propVal = convert[this.props.type](newVal);
            if (this.props.type === 'integer' || this.props.type === 'int' ||
                this.props.type === 'double'  || this.props.type === 'dbl') {
                propVal = this.clamp(propVal);
            }
            this.props.onChange(this.props.idx, propVal);
        }
    },

  clamp(val) {
    if (this.props.domain.hasOwnProperty('min')) {
      val = Math.max(this.props.domain.min, val);
    }
    if (this.props.domain.hasOwnProperty('max')) {
      val = Math.min(this.props.domain.max, val);
    }
    return val;
  },

  endEditing(){
    this.setState({editing: false});
  },

  render() {
    return (
      <td className={ style.inputCell }>
        <label className={ style.inputCellLabel }>{this.props.label}</label>
        <input
            className={ style.inputCellInput }
            value={this.state.editing ? this.state.valueRep : this.props.value}
            onChange={this.valueChange}
            onBlur={this.endEditing}/>
      </td>);
  },
});
