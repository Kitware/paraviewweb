import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/PresetListWidget.mcss';

export default class PresetListWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeName: props.activeName,
    };

    // Bind callback
    this.updateActive = this.updateActive.bind(this);
  }

  updateActive(event) {
    const activeName = event.target.dataset.name;
    this.setState({ activeName });
    if (this.props.onChange) {
      this.props.onChange(activeName);
    }
  }

  render() {
    if (!this.props.presets || !this.props.visible) {
      return null;
    }

    const activeName = this.state.activeName,
      height = this.props.height,
      presets = this.props.presets,
      names = Object.keys(presets);

    return (
      <div className={style.container}>
        <div className={style.bottomPadding} />
        {names.map((name) => (
          <img
            alt="Preset"
            src={`data:image/png;base64,${presets[name]}`}
            key={name}
            style={{ height }}
            data-name={name}
            onClick={this.updateActive}
            className={name === activeName ? style.activeLine : style.line}
          />
        ))}
        <div className={style.bottomPadding} />
      </div>
    );
  }
}

PresetListWidget.propTypes = {
  activeName: PropTypes.string,
  height: PropTypes.string,
  onChange: PropTypes.func,
  presets: PropTypes.object,
  visible: PropTypes.bool,
};

PresetListWidget.defaultProps = {
  activeName: '',
  height: '1em',
  presets: {},
  visible: true,
};
