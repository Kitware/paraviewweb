import React            from 'react';

import style            from 'PVWStyle/ReactProperties/CellProperty.mcss';

import BlockMixin       from '../PropertyFactory/BlockMixin';
import Slider           from './Slider';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

/* eslint-disable react/no-danger */
export default React.createClass({

  displayName: 'SliderProperty',

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

  valueChange(idx, newVal) {
    var newData = this.state.data;
    if (idx === null) {
      newData.value = newVal;
    } else {
      newData.value[idx] = newVal;
    }
    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  },

  render() {
    const mapper = () => {
      if (Array.isArray(this.props.data.value)) {
        const ret = [];
        for (let i = 0; i < this.props.data.value.length; i++) {
          const step = (this.props.ui.type && this.props.ui.type.toLowerCase() === 'double' ? 0.1 : 1);
          ret.push(
            <Slider
              value={this.props.data.value[i]}
              min={this.props.ui.domain.min}
              max={this.props.ui.domain.max}
              step={step} // int 1, double 0.1
              idx={i}
              onChange={this.valueChange}
              key={`${this.props.data.id}_${i}`}
            />);
        }
        return ret;
      }

      const step = (this.props.ui.type && this.props.ui.type.toLowerCase() === 'double' ? 0.1 : 1);
      return (
        <Slider
          value={this.props.data.value}
          min={this.props.ui.domain.min}
          max={this.props.ui.domain.max}
          step={step}
          onChange={this.valueChange}
        />);
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
          {mapper()}
        </div>
        <div
          className={this.state.helpOpen ? style.helpBox : style.hidden}
          dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
        />
      </div>);
  },
});
