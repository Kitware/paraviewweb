import React            from 'react';

import style            from 'PVWStyle/ReactProperties/CellProperty.mcss';
import styleProp        from 'PVWStyle/ReactProperties/MapProperty.mcss';

import BlockMixin       from '../PropertyFactory/BlockMixin';
import KeyValuePair     from './KeyValuePair';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

/* eslint-disable react/no-danger */
export default React.createClass({

  displayName: 'MapProperty',

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

  valueChange(idx, key, value) {
    const { data } = this.state;
    if (key === value && key === undefined) {
      data.value.splice(idx, 1);
    } else {
      data.value[idx][key] = value;
    }
    this.setState({ data });

    if (this.props.onChange) {
      this.props.onChange(data);
    }
  },

  addEntry() {
    const { data } = this.state;
    data.value.push({ name: '', value: '' });
    this.setState({ data });
  },

  render() {
    const mapper = () => {
      if (Array.isArray(this.state.data.value)) {
        const ret = [];
        for (let i = 0; i < this.state.data.value.length; i++) {
          ret.push(
            <KeyValuePair
              idx={i}
              value={this.state.data.value[i]}
              key={`${this.state.data.id}_${i}`}
              onChange={this.valueChange}
            />);
        }
        return ret;
      }

      return null;
    };

    return (
      <div className={this.props.show(this.props.viewData) ? style.container : style.hidden}>
        <div className={style.header}>
          <strong>{this.props.ui.label}</strong>
          <span>
            <ToggleIconButton
              icon={style.helpIcon}
              value={this.state.helpOpen}
              toggle={!!this.props.ui.help}
              onChange={this.helpToggled}
            />
          </span>
        </div>
        <div className={style.inputBlock}>
          <table className={styleProp.table}>
            <tbody>
              <tr>
                <th className={styleProp.inputColumn}>Name</th>
                <th className={styleProp.inputColumn}>Value</th>
                <th className={styleProp.actionColumn}><i className={styleProp.addButton} onClick={this.addEntry} /></th>
              </tr>
              {mapper()}
            </tbody>
          </table>
        </div>
        <div
          className={this.state.helpOpen ? style.helpBox : style.hidden}
          dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
        />
      </div>);
  },
});
