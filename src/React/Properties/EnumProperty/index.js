import React            from 'react';

import convert          from '../../../Common/Misc/Convert';
import BlockMixin       from '../PropertyFactory/BlockMixin';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

import style            from 'PVWStyle/ReactProperties/CellProperty.mcss';
import enumStyle        from 'PVWStyle/ReactProperties/EnumProperty.mcss';

/* eslint-disable react/no-danger */
export default React.createClass({

  displayName: 'EnumProperty',

  propTypes: {
    data: React.PropTypes.object.isRequired,
    help: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func,
    show: React.PropTypes.func,
    ui: React.PropTypes.object.isRequired,
    viewData: React.PropTypes.object,
  },

  mixins: [BlockMixin],

  valueChange(e) {
    var newData = this.state.data;
    if (Array.isArray(this.state.data.value)) {
      const newVals = [];
      for (let i = 0; i < e.target.options.length; i++) {
        const el = e.target.options.item(i);
        if (el.selected) {
          newVals.push(el.value);
        }
      }
      newData.value = newVals.map(convert[this.props.ui.type]);
    } else if (e.target.value === null) {
      newData.value = null;
    } else {
      newData.value = [convert[this.props.ui.type](e.target.value)];
    }

    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  },

  render() {
    const multiple = (this.props.ui.size === -1),
      mapper = () => {
        var ret = [];
        if (!multiple && !this.props.ui.noEmpty) {
          ret.push(<option key="empty-value" value={null}></option>);
        }

        for (const key in this.props.ui.domain) {
          ret.push(
            <option
              value={this.props.ui.domain[key]}
              key={ `${this.props.data.id}_${key}` }
            >
              {key}
            </option>);
        }
        return ret;
      };

    return (
      <div className={ this.props.show(this.props.viewData) ? style.container : style.hidden }>
          <div className={ style.header }>
              <strong>{this.props.ui.label}</strong>
              <span>
                  <ToggleIconButton
                    icon={ style.helpIcon }
                    value={this.state.helpOpen}
                    toggle={!!this.props.ui.help}
                    onChange={this.helpToggled}
                  />
              </span>
          </div>
          <div className={ style.inputBlock }>
              <select
                className={ multiple ? enumStyle.inputMultiSelect : enumStyle.input }
                value={multiple ? this.props.data.value : this.props.data.value[0]}
                defaultValue={null}
                onChange={this.valueChange}
                multiple={multiple}
              >
                  { mapper() }
              </select>
          </div>
          <div
            className={ this.state.helpOpen ? style.helpBox : style.hidden }
            dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
          />
      </div>);
  },
});
