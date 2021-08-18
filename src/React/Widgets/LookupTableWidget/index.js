import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/LookupTableWidget.mcss';

import ColorPicker from '../ColorPickerWidget';
import NumberInputWidget from '../NumberInputWidget';

const STYLE = {
  range: {
    none: {
      display: 'flex',
    },
    edit: {
      display: 'flex',
    },
    preset: {
      display: 'none',
    },
  },
  editContent: {
    none: {
      display: 'none',
    },
    edit: {
      display: 'flex',
    },
    preset: {
      display: 'none',
    },
  },
  presets: {
    none: {
      display: 'none',
    },
    edit: {
      display: 'none',
    },
    preset: {
      display: 'flex',
    },
  },
};

/**
 * This React component expect the following input properties:
 *   - lut:
 *       Expect a LokkupTable instance that you want to render and edit.
 *
 *   - originalRange:
 *       Expect the data range to use for the lookup table in case of reset.
 *
 *   - inverse:
 *       Expect a boolean. If true the control point will be display using the
 *       inverse of the actual color. Otherwise a white or black line will be used
 *       depending on which one provide the best contrast for that scalar value.
 *
 *   - lutManager:
 *       Expect a reference to the lookup table manager to use.
 *
 */
export default class LookupTableWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'none',
      activePreset: props.lookupTable.getPresets()[0],
      currentControlPointIndex: 0,
      internal_lut: false,
      originalRange: props.originalRange,
    };

    // Bind callback
    this.setPreset = this.setPreset.bind(this);
    this.updateScalarRange = this.updateScalarRange.bind(this);
    this.addControlPoint = this.addControlPoint.bind(this);
    this.deleteControlPoint = this.deleteControlPoint.bind(this);
    this.nextControlPoint = this.nextControlPoint.bind(this);
    this.previousControlPoint = this.previousControlPoint.bind(this);
    this.updateScalar = this.updateScalar.bind(this);
    this.updateRGB = this.updateRGB.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.togglePresetMode = this.togglePresetMode.bind(this);
    this.attachListener = this.attachListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.updateOriginalRange = this.updateOriginalRange.bind(this);
    this.resetRange = this.resetRange.bind(this);
    this.changePreset = this.changePreset.bind(this);
    this.nextPreset = this.nextPreset.bind(this);
    this.previousPreset = this.previousPreset.bind(this);
    this.deltaPreset = this.deltaPreset.bind(this);
  }

  componentWillMount() {
    this.attachListener(this.props.lookupTable);
  }

  componentDidMount() {
    const canvas = this.canvas;
    this.props.lookupTable.drawToCanvas(canvas);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.lookupTable !== this.props.lookupTable) {
      this.removeListener();
      this.attachListener(nextProps.lookupTable);
    }
    if (
      this.props.originalRange[0] !== nextProps.originalRange[0] ||
      this.props.originalRange[1] !== nextProps.originalRange[1]
    ) {
      this.setState({ originalRange: nextProps.originalRange });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.state.internal_lut) {
      const canvas = this.canvas;
      this.props.lookupTable.drawToCanvas(canvas);

      if (this.state.mode === 'edit') {
        // Draw control point
        const ctx = canvas.getContext('2d');
        const x = Math.floor(
          this.props.lookupTable.getControlPoint(
            this.state.currentControlPointIndex
          ).x * this.props.lookupTable.colorTableSize
        );
        const imageData = ctx.getImageData(
          0,
          0,
          this.props.lookupTable.colorTableSize,
          1
        );

        const color =
          imageData.data[x * 4] +
            imageData.data[x * 4 + 1] +
            imageData.data[x * 4 + 2] >
          (3 * 255) / 2
            ? 0
            : 255;
        imageData.data[x * 4 + 0] = this.props.inverse
          ? (imageData.data[x * 4 + 0] + 128) % 256
          : color;
        imageData.data[x * 4 + 1] = this.props.inverse
          ? (imageData.data[x * 4 + 1] + 128) % 256
          : color;
        imageData.data[x * 4 + 2] = this.props.inverse
          ? (imageData.data[x * 4 + 2] + 128) % 256
          : color;

        ctx.putImageData(imageData, 0, 0);
      }
    }
  }

  componentWillUnmount() {
    this.removeListener();
  }

  setPreset(event) {
    this.props.lookupTable.setPreset(event.target.dataset.name);
    this.togglePresetMode();
  }

  updateScalarRange() {
    const originalRange = this.props.lookupTable.getScalarRange();
    const minValue = this.min.getValue() || originalRange[0];
    const maxValue = this.max.getValue() || originalRange[1];

    this.props.lookupTable.setScalarRange(
      minValue,
      minValue === maxValue ? maxValue + 1 : maxValue
    );
    this.forceUpdate();
  }

  addControlPoint() {
    const newIdx = this.props.lookupTable.addControlPoint({
      x: 0.5,
      r: 0,
      g: 0,
      b: 0,
    });
    this.setState({ currentControlPointIndex: newIdx });
  }

  deleteControlPoint() {
    if (
      this.props.lookupTable.removeControlPoint(
        this.state.currentControlPointIndex
      )
    ) {
      this.forceUpdate();
    }
  }

  nextControlPoint() {
    const newIdx = this.state.currentControlPointIndex + 1;

    if (newIdx < this.props.lookupTable.getNumberOfControlPoints()) {
      this.setState({ currentControlPointIndex: newIdx });
    }
  }

  previousControlPoint() {
    const newIdx = this.state.currentControlPointIndex - 1;

    if (newIdx > -1) {
      this.setState({ currentControlPointIndex: newIdx });
    }
  }

  updateScalar(newVal) {
    const scalarRange = this.props.lookupTable.getScalarRange();
    const xValue =
      (newVal - scalarRange[0]) / (scalarRange[1] - scalarRange[0]);
    const controlPoint = this.props.lookupTable.getControlPoint(
      this.state.currentControlPointIndex
    );

    const newIdx = this.props.lookupTable.updateControlPoint(
      this.state.currentControlPointIndex,
      {
        x: xValue,
        r: controlPoint.r,
        g: controlPoint.g,
        b: controlPoint.b,
      }
    );
    this.setState({ currentControlPointIndex: newIdx });
    this.forceUpdate();
  }

  updateRGB(rgb) {
    const controlPoint = this.props.lookupTable.getControlPoint(
      this.state.currentControlPointIndex
    );

    const newIdx = this.props.lookupTable.updateControlPoint(
      this.state.currentControlPointIndex,
      {
        x: controlPoint.x,
        r: rgb[0] / 255,
        g: rgb[1] / 255,
        b: rgb[2] / 255,
      }
    );
    this.setState({ currentControlPointIndex: newIdx });
  }

  toggleEditMode() {
    if (this.state.mode === 'none' || this.state.mode !== 'edit') {
      this.setState({ mode: 'edit', internal_lut: false });
    } else {
      this.setState({ mode: 'none', internal_lut: false });
    }
  }

  togglePresetMode() {
    if (this.state.mode === 'none' || this.state.mode !== 'preset') {
      this.deltaPreset(0); // Render preset
      this.setState({ mode: 'preset', internal_lut: true });
    } else {
      this.setState({ mode: 'none', internal_lut: false });
    }
  }

  attachListener(lut) {
    this.subscription = lut.onChange((data, envelope) => {
      this.forceUpdate();
    });
  }

  removeListener() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  updateOriginalRange(min, max) {
    console.log(
      `Someone asked LookupTableWidget to update original range to [${min}, ${max}]`
    );
    this.setState({ originalRange: [min, max] });
  }

  resetRange() {
    const range = this.state.originalRange;
    const currentRange = this.props.lookupTable.getScalarRange();
    console.log(
      `LookupTableWidget current range: [${currentRange[0]}, ${currentRange[1]}], new range: [${range[0]}, ${range[1]}]`
    );
    this.props.lookupTable.setScalarRange(range[0], range[1]);
  }

  changePreset(event) {
    const delta = event.detail || event.deltaY || event.deltaX;
    event.preventDefault();
    this.deltaPreset(delta);
  }

  nextPreset() {
    this.deltaPreset(1);
  }

  previousPreset() {
    this.deltaPreset(-1);
  }

  deltaPreset(delta) {
    const presets = this.props.lookupTable.getPresets();
    let currentIdx = presets.indexOf(this.state.activePreset);
    let newPreset = null;

    currentIdx += delta === 0 ? 0 : delta < 0 ? -1 : 1;
    if (currentIdx < 0 || currentIdx === presets.length) {
      return;
    }

    newPreset = presets[currentIdx];
    if (this.props.lookupTableManager) {
      let lut = this.props.lookupTableManager.getLookupTable('__internal');
      if (!lut) {
        lut = this.props.lookupTableManager.addLookupTable(
          '__internal',
          [0, 1],
          newPreset
        );
      } else {
        lut.setPreset(newPreset);
      }
      lut.drawToCanvas(this.canvas);
    }
    this.setState({ activePreset: newPreset });
  }

  render() {
    const scalarRange = this.props.lookupTable.getScalarRange();
    const controlPoint = this.props.lookupTable.getControlPoint(
      this.state.currentControlPointIndex
    );
    const controlPointValue =
      controlPoint.x * (scalarRange[1] - scalarRange[0]) + scalarRange[0];
    const color = [
      Math.floor(255 * controlPoint.r),
      Math.floor(255 * controlPoint.g),
      Math.floor(255 * controlPoint.b),
    ];

    return (
      <div className={style.container}>
        <div className={style.line}>
          <i className={style.editButton} onClick={this.toggleEditMode} />
          <canvas
            ref={(c) => {
              this.canvas = c;
            }}
            className={style.canvas}
            width={
              this.props.lookupTable.colorTableSize *
              this.props.lookupTable.scale
            }
            height="1"
          />
          <i className={style.presetButton} onClick={this.togglePresetMode} />
        </div>
        <div className={style.range} style={STYLE.range[this.state.mode]}>
          <NumberInputWidget
            ref={(c) => {
              this.min = c;
            }}
            className={style.input}
            value={this.props.lookupTable.getScalarRange()[0]}
            onChange={this.updateScalarRange}
          />
          <i onClick={this.resetRange} className={style.resetRangeButton} />
          <NumberInputWidget
            ref={(c) => {
              this.max = c;
            }}
            className={style.inputRight}
            value={this.props.lookupTable.getScalarRange()[1]}
            onChange={this.updateScalarRange}
          />
        </div>
        <div
          className={style.editContent}
          style={STYLE.editContent[this.state.mode]}
        >
          <div className={style.line}>
            <i
              onClick={this.previousControlPoint}
              className={style.previousButton}
            />
            <div className={style.label}>
              {this.state.currentControlPointIndex + 1}/{' '}
              {this.props.lookupTable.getNumberOfControlPoints()}
            </div>
            <i onClick={this.nextControlPoint} className={style.nextButton} />
            <i onClick={this.addControlPoint} className={style.addButton} />
            <NumberInputWidget
              className={style.inputRight}
              value={controlPointValue}
              onChange={this.updateScalar}
            />
            <i
              onClick={this.deleteControlPoint}
              className={style.deleteButton}
            />
          </div>
          <ColorPicker color={color} onChange={this.updateRGB} />
        </div>
        <div className={style.presets} style={STYLE.presets[this.state.mode]}>
          <i
            onClick={this.previousPreset}
            className={
              this.state.activePreset === this.props.lookupTable.getPresets()[0]
                ? style.disablePreviousButton
                : style.previousButton
            }
          />
          {this.props.lookupTable.getPresets().map((preset) => (
            <div
              onClick={this.setPreset}
              onScroll={this.changePreset}
              onWheel={this.changePreset}
              className={
                this.state.activePreset === preset
                  ? style.preset
                  : style.hiddenPreset
              }
              data-name={preset}
              key={preset}
            >
              {preset}
            </div>
          ))}
          <i
            onClick={this.nextPreset}
            className={
              this.state.activePreset ===
              this.props.lookupTable.getPresets()[
                this.props.lookupTable.getPresets().length - 1
              ]
                ? style.disableNextButton
                : style.nextButton
            }
          />
        </div>
      </div>
    );
  }
}

LookupTableWidget.propTypes = {
  inverse: PropTypes.bool,
  lookupTable: PropTypes.object.isRequired,
  lookupTableManager: PropTypes.object,
  originalRange: PropTypes.array,
};

LookupTableWidget.defaultProps = {
  inverse: false,
  lookupTableManager: undefined,
  originalRange: undefined,
};
