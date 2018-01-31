import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ColorMapEditorWidget.mcss';

import SvgIconWidget from '../SvgIconWidget';
import PieceWiseFunctionEditorWidget from '../PieceWiseFunctionEditorWidget';
import PresetListWidget from '../PresetListWidget';

import paletteIcon from '../../../../svg/colors/Palette.svg';
import opacityIcon from '../../../../svg/colors/Opacity.svg';
import timeIcon from '../../../../svg/colors/Time.svg';
import datasetIcon from '../../../../svg/colors/DataSet.svg';

export default class ColorMapEditorWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOpacityControls: false,
      showPresetSelection: false,
    };

    // Bind callback
    this.onOpacityTransferFunctionChanged = this.onOpacityTransferFunctionChanged.bind(
      this
    );
    this.toggleShowOpacityControls = this.toggleShowOpacityControls.bind(this);
    this.toggleShowPresetSelection = this.toggleShowPresetSelection.bind(this);
    this.rangeMinChanged = this.rangeMinChanged.bind(this);
    this.rangeMaxChanged = this.rangeMaxChanged.bind(this);
    this.presetChanged = this.presetChanged.bind(this);
  }

  onOpacityTransferFunctionChanged(newPoints) {
    if (this.props.onOpacityTransferFunctionChanged) {
      this.props.onOpacityTransferFunctionChanged(newPoints);
    }
  }

  toggleShowOpacityControls() {
    const newState = { showOpacityControls: !this.state.showOpacityControls };
    if (this.state.showPresetSelection && newState.showOpacityControls) {
      newState.showPresetSelection = false;
    }
    this.setState(newState);
  }

  toggleShowPresetSelection() {
    const newState = { showPresetSelection: !this.state.showPresetSelection };
    if (this.state.showOpacityControls && newState.showPresetSelection) {
      newState.showOpacityControls = false;
    }
    this.setState(newState);
  }

  rangeMinChanged(e) {
    const newMin = parseFloat(e.target.value);
    if (this.props.onRangeEdited) {
      this.props.onRangeEdited([newMin, this.props.rangeMax]);
    }
  }

  rangeMaxChanged(e) {
    const newMax = parseFloat(e.target.value);
    if (this.props.onRangeEdited) {
      this.props.onRangeEdited([this.props.rangeMin, newMax]);
    }
  }

  presetChanged(name) {
    if (this.props.onPresetChanged) {
      this.props.onPresetChanged(name);
    }
  }

  render() {
    const presets = this.props.presets;
    const name = this.props.currentPreset;
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
            alt={this.props.currentPreset}
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
            value={this.props.rangeMin}
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
            value={this.props.rangeMax}
            onChange={this.rangeMaxChanged}
          />
        </div>
        <div
          className={
            this.state.showOpacityControls
              ? style.pieceWiseEditor
              : style.hidden
          }
        >
          <PieceWiseFunctionEditorWidget
            points={this.props.currentOpacityPoints}
            rangeMin={this.state.showOpacityControls ? this.props.rangeMin : 1}
            rangeMax={this.state.showOpacityControls ? this.props.rangeMax : 0}
            onChange={this.onOpacityTransferFunctionChanged}
            height={this.props.pieceWiseHeight}
            width={this.props.pieceWiseWidth}
          />
        </div>
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
  }
}

ColorMapEditorWidget.propTypes = {
  currentOpacityPoints: PropTypes.array,
  currentPreset: PropTypes.string,
  dataRangeMin: PropTypes.number,
  dataRangeMax: PropTypes.number,
  presets: PropTypes.object,
  rangeMin: PropTypes.number,
  rangeMax: PropTypes.number,
  onOpacityTransferFunctionChanged: PropTypes.func,
  onPresetChanged: PropTypes.func,
  onRangeEdited: PropTypes.func,
  onScaleRangeToCurrent: PropTypes.func,
  onScaleRangeOverTime: PropTypes.func,
  pieceWiseHeight: PropTypes.number,
  pieceWiseWidth: PropTypes.number,
};

ColorMapEditorWidget.defaultProps = {
  pieceWiseHeight: 200,
  pieceWiseWidth: -1,
};
