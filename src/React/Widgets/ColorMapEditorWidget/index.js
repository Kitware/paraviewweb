import React from 'react';
import SvgIconWidget from '../SvgIconWidget';
import PieceWiseFunctionEditorWidget from '../PieceWiseFunctionEditorWidget';
import PresetListWidget from '../PresetListWidget';

import style from 'PVWStyle/ReactWidgets/ColorMapEditorWidget.mcss';

import paletteIcon from '../../../../svg/colors/Palette.svg';
import opacityIcon from '../../../../svg/colors/Opacity.svg';
import timeIcon from '../../../../svg/colors/Time.svg';
import datasetIcon from '../../../../svg/colors/DataSet.svg';

export default React.createClass({

  displayName: 'ColorMapEditorWidget',

  propTypes: {
    initialOpacityMap: React.PropTypes.string,
    initialPreset: React.PropTypes.string,
    initialRange: React.PropTypes.array,
    dataRangeMin: React.PropTypes.number,
    dataRangeMax: React.PropTypes.number,
    presets: React.PropTypes.object,
    onOpacityTransferFunctionChanged: React.PropTypes.func,
    onPresetChanged: React.PropTypes.func,
    onRangeEdited: React.PropTypes.func,
    onScaleRangeToCurrent: React.PropTypes.func,
    onScaleRangeOverTime: React.PropTypes.func,
  },

  getInitialState() {
    return {
      currentPreset: this.props.initialPreset,
      range: this.props.initialRange,
      currentOpacityPoints: this.props.initialOpacityMap,
      showOpacityControls: false,
      showPresetSelection: false,
    };
  },

  componentWillReceiveProps(newProps) {
    if (newProps.initialRange[0] !== this.props.initialRange[0] ||
        newProps.initialRange[1] !== this.props.initialRange[1]) {
      this.setState({ range: newProps.initialRange });
    }
  },

  onOpacityTransferFunctionChanged(newPoints) {
    this.setState({ currentOpacityPoints: newPoints });
    this.props.onOpacityTransferFunctionChanged(newPoints);
  },

  toggleShowOpacityControls() {
    const newState = { showOpacityControls: !this.state.showOpacityControls };
    if (this.state.showPresetSelection && newState.showOpacityControls) {
      newState.showPresetSelection = false;
    }
    this.setState(newState);
  },

  toggleShowPresetSelection() {
    const newState = { showPresetSelection: !this.state.showPresetSelection };
    if (this.state.showOpacityControls && newState.showPresetSelection) {
      newState.showOpacityControls = false;
    }
    this.setState(newState);
  },

  rangeMinChanged(e) {
    const newMin = parseFloat(e.target.value);
    this.setState({ range: [newMin, this.state.range[1]] });
    if (this.props.onRangeEdited) {
      this.props.onRangeEdited([newMin, this.state.range[1]]);
    }
  },

  rangeMaxChanged(e) {
    const newMax = parseFloat(e.target.value);
    this.setState({ range: [this.state.range[0], newMax] });
    if (this.props.onRangeEdited) {
      this.props.onRangeEdited([this.state.range[0], newMax]);
    }
  },

  presetChanged(name) {
    this.setState({ currentPreset: name });
    if (this.props.onPresetChanged) {
      this.props.onPresetChanged(name);
    }
  },

  render() {
    const opacityControls = (
      <PieceWiseFunctionEditorWidget
        initialPoints={this.state.currentOpacityPoints}
        ref="pieceWiseEditor"
        rangeMin={this.state.range[0]}
        rangeMax={this.state.range[1]}
        onChange={this.onOpacityTransferFunctionChanged}
      />
    );
    const presets = this.props.presets;
    const name = this.state.currentPreset;
    return (
      <div className={style.colormapeditor}>
        <div className={style.mainControls}>
          <SvgIconWidget
            className={style.svgIcon}
            icon={opacityIcon}
            onClick={this.toggleShowOpacityControls}
          />
          <img
            className={style.presetImage}
            src={`data:image/png;base64,${presets[name]}`}
            alt={this.state.currentPreset}
          />
          <SvgIconWidget
            className={style.svgIcon}
            icon={paletteIcon}
            onClick={this.toggleShowPresetSelection}
          />
        </div>
        <div className={style.rangeControls}>
          <input
            className={style.minRangeInput}
            type="number"
            step="any"
            min={this.props.dataRangeMin}
            max={this.props.dataRangeMax}
            value={this.state.range[0]}
            onChange={this.rangeMinChanged}
          />
          <div className={style.rangeResetButtons}>
            <SvgIconWidget
              className={style.svgIcon}
              icon={timeIcon}
              onClick={this.props.onScaleRangeOverTime}
            />
            <SvgIconWidget
              className={style.svgIcon}
              icon={datasetIcon}
              onClick={this.props.onScaleRangeToCurrent}
            />
          </div>
          <input
            className={style.maxRangeInput}
            type="number"
            step="any"
            min={this.props.dataRangeMin}
            max={this.props.dataRangeMax}
            value={this.state.range[1]}
            onChange={this.rangeMaxChanged}
          />
        </div>
        {this.state.showOpacityControls ? opacityControls : null}
        <div className={style.presetList}>
          <PresetListWidget
            presets={presets}
            height="1em"
            visible={this.state.showPresetSelection}
            activeName={name}
            onChange={this.presetChanged}
          />
        </div>
      </div>
    );
  },
});
