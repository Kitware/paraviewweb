import React  from 'react';
import style  from 'PVWStyle/ReactWidgets/PresetListWidget.mcss';

export default React.createClass({

  displayName: 'PresetListWidget',

  propTypes: {
    activeName: React.PropTypes.string,
    height: React.PropTypes.string,
    onChange: React.PropTypes.func,
    presets: React.PropTypes.object,
    visible: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      activeName: '',
      height: '1em',
      presets: {},
      visible: true,
    };
  },

  getInitialState() {
    return {
      activeName: this.props.activeName,
    };
  },

  updateActive(event) {
    const activeName = event.target.dataset.name;
    this.setState({ activeName });
    if (this.props.onChange) {
      this.props.onChange(activeName);
    }
  },

  render() {
    if (!this.props.presets || !this.props.visible) {
      return null;
    }

    const activeName = this.state.activeName,
      height = this.props.height,
      presets = this.props.presets,
      names = Object.keys(presets);

    return (
      <div className={ style.container }>
        <div className={ style.bottomPadding } />
        { names.map(name =>
          <img
            src={ `data:image/png;base64,${presets[name]}` }
            key={ name }
            style={{ height }}
            data-name={ name }
            onClick={ this.updateActive }
            className={ (name === activeName) ? style.activeLine : style.line }
          />
        )}
        <div className={ style.bottomPadding } />
      </div>);
  },
});
