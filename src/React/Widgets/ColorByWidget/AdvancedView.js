import React              from 'react';

import style              from 'PVWStyle/ReactWidgets/ColorByWidget.mcss';

import PresetListWidget   from '../PresetListWidget';
import ScalarRangeWidget  from '../ScalarRangeWidget';
import PieceWiseFunctionEditorWidget from '../PieceWiseFunctionEditorWidget';

export default React.createClass({

  displayName: 'ColorByWidget',

  propTypes: {
    className: React.PropTypes.string,
    max: React.PropTypes.number,
    min: React.PropTypes.number,
    onChange: React.PropTypes.func,
    presets: React.PropTypes.object,
    representation: React.PropTypes.object,
    scalarBar: React.PropTypes.string,
    source: React.PropTypes.object,
    visible: React.PropTypes.bool,
    hidePointControl: React.PropTypes.bool,
    opacityPoints: React.PropTypes.array,
    onOpacityPointsChange: React.PropTypes.func,
    onOpacityEditModeChange: React.PropTypes.func,
    opacityEditorSize: React.PropTypes.array,
  },

  getInitialState() {
    return {
      activeAdvanceView: '0',
    };
  },

  updatePreset(name) {
    if (this.props.onChange) {
      this.props.onChange({
        type: 'updatePreset',
        representation: this.props.representation.id,
        preset: name,
      });
    }
  },

  updateRange(options) {
    options.proxyId = this.props.source.id;
    if (this.props.onChange) {
      this.props.onChange({
        type: 'updateScalarRange',
        options,
      });
    }
  },

  updateActiveView(event) {
    const activeAdvanceView = event.target.dataset.idx;
    this.setState({ activeAdvanceView });
  },

  render() {
    return (
      <div className={this.props.visible ? style.advancedView : style.hidden} >
        <div className={style.advancedViewControl}>
          <i
            data-idx="0"
            onClick={this.updateActiveView}
            className={this.state.activeAdvanceView === '0' ? style.activePresetIcon : style.presetIcon}
          />
          <i
            data-idx="1"
            onClick={this.updateActiveView}
            className={this.state.activeAdvanceView === '1' ? style.activeRangeIcon : style.rangeIcon}
          />
          <i
            data-idx="2"
            onClick={this.updateActiveView}
            className={this.state.activeAdvanceView === '2' ? style.activeOpacityIcon : style.opacityIcon}
          />
        </div>
        <div className={style.advancedViewContent}>
          <PresetListWidget
            visible={this.state.activeAdvanceView === '0'}
            onChange={this.updatePreset}
            presets={this.props.presets}
          />
          <ScalarRangeWidget
            visible={this.state.activeAdvanceView === '1'}
            min={this.props.min}
            max={this.props.max}
            onApply={this.updateRange}
          />
          {this.state.activeAdvanceView === '2' ?
            <PieceWiseFunctionEditorWidget
              points={this.props.opacityPoints}
              rangeMin={this.props.min}
              rangeMax={this.props.max}
              onChange={this.props.onOpacityPointsChange}
              onEditModeChange={this.props.onOpacityEditModeChange}
              height={this.props.opacityEditorSize[1]}
              width={this.props.opacityEditorSize[0]}
              hidePointControl={this.props.hidePointControl}
            /> : null
          }
        </div>
      </div>);
  },
});

// <i
//   data-idx="3"
//   onClick={this.updateActiveView}
//   className={this.state.activeAdvanceView === '3' ? style.activeColorEditIcon : style.colorEditIcon}
// ></i>
