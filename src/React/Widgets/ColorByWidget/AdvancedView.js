import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ColorByWidget.mcss';

import PresetListWidget   from '../PresetListWidget';
import ScalarRangeWidget  from '../ScalarRangeWidget';
import PieceWiseFunctionEditorWidget from '../PieceWiseFunctionEditorWidget';
import PieceWiseGaussianFunctionEditorWidget from '../PieceWiseGaussianFunctionEditorWidget';

export default class ColorByWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeAdvanceView: '0' };

    // Bind callback
    this.updatePreset = this.updatePreset.bind(this);
    this.updateRange = this.updateRange.bind(this);
    this.updateActiveView = this.updateActiveView.bind(this);
  }

  updatePreset(name) {
    if (this.props.onChange) {
      this.props.onChange({
        type: 'updatePreset',
        representation: this.props.representation.id,
        preset: name,
      });
    }
  }

  updateRange(options) {
    options.proxyId = this.props.source.id;
    if (this.props.onChange) {
      this.props.onChange({
        type: 'updateScalarRange',
        options,
      });
    }
  }

  updateActiveView(event) {
    const activeAdvanceView = event.target.dataset.idx;
    this.setState({ activeAdvanceView });
  }

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
          {this.state.activeAdvanceView === '2' && !this.props.useGaussian ?
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
          {this.state.activeAdvanceView === '2' && this.props.useGaussian ?
            <PieceWiseGaussianFunctionEditorWidget
              points={this.props.opacityPoints}
              gaussians={this.props.gaussians}
              bgImage={this.props.scalarBar}
              rangeMin={this.props.min}
              rangeMax={this.props.max}
              onChange={this.props.onOpacityPointsChange}
              onEditModeChange={this.props.onOpacityEditModeChange}
              height={this.props.opacityEditorSize[1]}
              width={this.props.opacityEditorSize[0]}
            /> : null
          }
        </div>
      </div>);
  }
}

// <i
//   data-idx="3"
//   onClick={this.updateActiveView}
//   className={this.state.activeAdvanceView === '3' ? style.activeColorEditIcon : style.colorEditIcon}
// ></i>

ColorByWidget.propTypes = {
  className: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  presets: PropTypes.object,
  representation: PropTypes.object,
  scalarBar: PropTypes.string,
  source: PropTypes.object,
  visible: PropTypes.bool,
  hidePointControl: PropTypes.bool,
  opacityPoints: PropTypes.array,
  onOpacityPointsChange: PropTypes.func,
  onOpacityEditModeChange: PropTypes.func,
  opacityEditorSize: PropTypes.array,
  useGaussian: PropTypes.bool,
  gaussians: PropTypes.array,
};

ColorByWidget.defaultProps = {
  opacityEditorSize: [-1, 96],
};
