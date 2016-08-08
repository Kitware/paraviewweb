import React        from 'react';
import style        from 'PVWStyle/ReactWidgets/ColorByWidget.mcss';
import AdvancedView from './AdvancedView';

const SEP = ':|:';

function doubleToHex(number) {
  var str = Math.floor(number * 255).toString(16);
  while (str.length < 2) {
    str = `0${str}`;
  }
  return str;
}

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
    opacityPoints: React.PropTypes.array,
    onOpacityPointsChange: React.PropTypes.func,
    opacityEditorSize: React.PropTypes.array,
  },

  getDefaultProps() {
    return {
      min: 0,
      max: 1,
    };
  },

  getInitialState() {
    return {
      advancedView: false,
      colorValue: SEP,
      colorValues: [],
      representationValue: '',
      representationValues: [],
      scalarBarVisible: false,
      solidColor: '#fff',
    };
  },

  componentWillMount() {
    this.updateState(this.props);
  },

  componentWillReceiveProps(nextProps) {
    this.updateState(nextProps);
  },

  onRepresentationChange(event) {
    const representationValue = event.target.value;
    this.setState({ representationValue });
    if (this.props.onChange) {
      this.props.onChange({
        type: 'propertyChange',
        changeSet: [{
          id: this.props.representation.id,
          name: 'Representation',
          value: representationValue,
        }],
      });
    }
  },

  onColorChange(event) {
    var scalarBarVisible = this.state.scalarBarVisible;
    const colorValue = event.target.value;
    const [arrayLocation, arrayName] = colorValue.split(SEP);
    const colorMode = arrayName ? 'array' : 'SOLID';
    const vectorMode = 'Magnitude';
    const vectorComponent = 0;
    const rescale = false;

    if (colorMode === 'SOLID') {
      scalarBarVisible = false;
    }


    this.setState({ colorValue, scalarBarVisible, colorMode });
    if (this.props.onChange) {
      this.props.onChange({
        type: 'colorBy',
        representation: this.props.representation.id,
        arrayLocation,
        arrayName,
        colorMode,
        vectorMode,
        vectorComponent,
        rescale,
      });
    }
  },

  updateState(props) {
    if (!props.source || !props.representation) {
      return;
    }

    const extractRepProp = p => (p.name === 'Representation');
    const removeFieldArray = a => (a.location !== 'FIELDS');
    const representationValues = props.representation.ui.filter(extractRepProp)[0].values;
    const representationValue = props.representation.properties.filter(extractRepProp)[0].value;
    const colorValues = [{ name: 'Solid color' }].concat(props.source.data.arrays.filter(removeFieldArray));
    const colorValue = props.representation.colorBy.array.filter((v, i) => i < 2).join(SEP);
    const scalarBarVisible = !!props.representation.colorBy.scalarBar;
    const solidColor = `#${props.representation.colorBy.color.map(doubleToHex).join('')}`;

    const colorMode = colorValue.split(SEP)[1] ? 'array' : 'SOLID';

    this.setState({
      representationValues,
      representationValue,
      colorValues,
      colorValue,
      scalarBarVisible,
      solidColor,
      colorMode,
    });
  },

  toggleScalarBar() {
    var scalarBarVisible = !this.state.scalarBarVisible;

    if (this.state.colorMode === 'SOLID') {
      scalarBarVisible = false;
    }

    this.setState({ scalarBarVisible });
    if (this.props.onChange) {
      this.props.onChange({
        type: 'scalarBar',
        source: this.props.source.id,
        representation: this.props.representation.id,
        visible: scalarBarVisible,
      });
    }
  },

  toggleAdvancedView() {
    const advancedView = !this.state.advancedView;
    this.setState({ advancedView });
  },

  render() {
    if (!this.props.source || !this.props.representation) {
      return null;
    }

    return (
      <div className={[style.container, this.props.className].join(' ')}>
        <div className={style.line}>
          <i className={style.representationIcon} />
          <select
            className={style.input}
            value={this.state.representationValue}
            onChange={this.onRepresentationChange}
          >
            {this.state.representationValues.map((v, idx) =>
              <option key={idx} value={v}>{v}</option>
            )}
          </select>
        </div>
        <div className={style.line}>
          <i className={style.colorIcon} />
          <select
            className={style.input}
            value={this.state.colorValue}
            onChange={this.onColorChange}
          >
            {this.state.colorValues.map((c, idx) =>
              <option key={idx} value={c.location ? [c.location, c.name].join(SEP) : ''}>
                {c.location ? `(${c.location === 'POINTS' ? 'p' : 'c'}${c.size}) ${c.name}` : c.name}
              </option>
            )}
          </select>
        </div>
        <div className={style.line}>
          <i
            onClick={this.toggleAdvancedView}
            className={this.state.advancedView ? style.advanceIconOn : style.advanceIconOff}
          />
          {this.props.scalarBar && this.state.colorValue && this.state.colorValue.split(SEP)[1].length ?
            <img
              onClick={this.toggleScalarBar}
              className={style.scalarBar}
              src={`data:image/png;base64,${this.props.scalarBar}`}
              alt="ScalarBar"
            />
            : <div className={style.scalarBar} style={{ backgroundColor: this.state.solidColor }} />
         }
          <i
            onClick={this.toggleScalarBar}
            className={this.state.scalarBarVisible ? style.scalarBarIconOn : style.scalarBarIconOff}
          />
        </div>
        <AdvancedView visible={this.state.advancedView} {...this.props} />
      </div>);
  },
});
