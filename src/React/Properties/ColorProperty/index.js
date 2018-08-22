import React from 'react';
import PropTypes from 'prop-types';

import ToggleIconButton from 'paraviewweb/src/React/Widgets/ToggleIconButtonWidget';
import style from 'paraviewweb/style/ReactProperties/CellProperty.mcss';

import ColorItem from './ColorItem';

export function hex2float(hexStr, outFloatArray = [0, 0.5, 1]) {
  switch (hexStr.length) {
    case 3: // abc => #aabbcc
      outFloatArray[0] = (parseInt(hexStr[0], 16) * 17) / 255;
      outFloatArray[1] = (parseInt(hexStr[1], 16) * 17) / 255;
      outFloatArray[2] = (parseInt(hexStr[2], 16) * 17) / 255;
      return outFloatArray;
    case 4: // #abc => #aabbcc
      outFloatArray[0] = (parseInt(hexStr[1], 16) * 17) / 255;
      outFloatArray[1] = (parseInt(hexStr[2], 16) * 17) / 255;
      outFloatArray[2] = (parseInt(hexStr[3], 16) * 17) / 255;
      return outFloatArray;
    case 6: // ab01df => #ab01df
      outFloatArray[0] = parseInt(hexStr.substr(0, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(2, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(4, 2), 16) / 255;
      return outFloatArray;
    case 7: // #ab01df
      outFloatArray[0] = parseInt(hexStr.substr(1, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(3, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(5, 2), 16) / 255;
      return outFloatArray;
    case 9: // #ab01df00
      outFloatArray[0] = parseInt(hexStr.substr(1, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(3, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(5, 2), 16) / 255;
      outFloatArray[3] = parseInt(hexStr.substr(7, 2), 16) / 255;
      return outFloatArray;
    default:
      return outFloatArray;
  }
}

export function sameColor(rgbaFloat1, rgbaFloat2) {
  if (rgbaFloat1.length !== rgbaFloat2.length) {
    return false;
  }
  let same = true;
  for (let i = 0; i < rgbaFloat1.length && same; i++) {
    same = Math.abs(rgbaFloat1[i] - rgbaFloat2[i]) < 0.003; // (1/255)
  }
  return same;
}

/* eslint-disable react/no-danger */
/* eslint-disable react/no-unused-prop-types */
export default class ColorProperty extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      helpOpen: false,
    };

    // Callback binding
    this.helpToggled = this.helpToggled.bind(this);
    this.onColorClick = this.onColorClick.bind(this);
  }

  componentWillMount() {
    const newState = {};
    if (this.props.ui.default && !this.props.data.value) {
      newState.data = this.state.data;
      newState.data.value = this.props.ui.default;
    }

    if (Object.keys(newState).length > 0) {
      this.setState(newState);
    }
  }

  componentWillReceiveProps(nextProps) {
    const data = nextProps.data;

    if (this.state.data !== data) {
      this.setState({
        data,
      });
    }
  }

  onColorClick(e) {
    const newColor = e.target.dataset.color
      .split(',')
      .map((str) => Number(str));
    const newData = this.state.data;
    newData.value = newColor;
    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  }

  helpToggled(open) {
    this.setState({
      helpOpen: open,
    });
  }

  render() {
    const palette = (
      (this.props.ui.domain && this.props.ui.domain.palette) ||
      this.props.palette
    ).map((hex) => hex2float(hex));
    return (
      <div
        className={
          this.props.show(this.props.viewData) ? style.container : style.hidden
        }
      >
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
        <div
          className={style.inputBlock}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          {palette.map((c, i) => (
            <ColorItem
              key={btoa(i)}
              active={sameColor(c, this.state.data.value)}
              color={c}
              onClick={this.onColorClick}
            />
          ))}
        </div>
        <div
          className={this.state.helpOpen ? style.helpBox : style.hidden}
          dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
        />
      </div>
    );
  }
}

ColorProperty.propTypes = {
  data: PropTypes.object.isRequired,
  help: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  show: PropTypes.func,
  ui: PropTypes.object.isRequired,
  viewData: PropTypes.object,
  palette: PropTypes.array,
};

ColorProperty.defaultProps = {
  name: '',
  help: '',
  onChange: () => {},
  show: () => true,
  viewData: {},
  palette: [
    '#51574a',
    '#447c69',
    '#74c493',
    '#8e8c6d',
    '#e4bf80',
    '#e9d78e',
    '#e2975d',
    '#f19670',
    '#e16552',
    '#c94a53',
    '#be5168',
    '#a34974',
    '#993767',
    '#65387d',
    '#4e2472',
    '#9163b6',
    '#e279a3',
    '#e0598b',
    '#7c9fb0',
    '#5698c4',
    '#9abf88',
  ],
};
