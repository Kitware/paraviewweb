import React  from 'react';
import equals from 'mout/src/object/equals';
import style  from 'PVWStyle/ReactWidgets/InlineToggleButtonWidget.mcss';

export default React.createClass({

  displayName: 'InlineToggleButtonWidget',

  propTypes: {
    active: React.PropTypes.number,
    activeColor: React.PropTypes.string,
    defaultColor: React.PropTypes.string,
    height: React.PropTypes.string,
    onChange: React.PropTypes.func,
    options: React.PropTypes.array.isRequired,
  },

  getDefaultProps() {
    return {
      activeColor: '#fff',
      defaultColor: '#ccc',
      height: '1em',
    };
  },

  getInitialState() {
    return {
      activeIdx: this.props.active || 0,
    };
  },

  componentWillReceiveProps(nextProps) {
    var previous = this.props,
      next = nextProps;

    if (!equals(previous, next)) {
      this.setState({
        activeIdx: next.active || 0,
      });
    }
  },

  activateButton(e) {
    const activeIdx = Number(e.target.dataset.idx);
    this.setState({ activeIdx });
    if (this.props.onChange) {
      this.props.onChange(this.props.options[activeIdx], activeIdx);
    }
  },

  render() {
    const currentActive = this.state.activeIdx,
      fontSize = this.props.height,
      lineHeight = this.props.height,
      height = this.props.height;

    return (
      <div className={style.container}>
        {this.props.options.map((obj, idx) => {
          const isActive = (currentActive === idx),
            background = isActive ? this.props.activeColor : this.props.defaultColor,
            className = (idx === 0) ?
              isActive ? 'activeFirst' : 'first' :
              (idx === this.props.options.length - 1) ?
                (isActive ? 'activeLast' : 'last') :
                (isActive ? 'activeMiddle' : 'middle');
          if (obj.label) {
            return (
              <button
                style={{ lineHeight, fontSize, background }}
                key={idx}
                onClick={this.activateButton}
                data-idx={idx}
                className={style[className]}
              >{obj.label}
              </button>);
          }
          if (obj.img) {
            return (
              <div
                style={{ lineHeight, height, fontSize, background }}
                key={idx}
                onClick={this.activateButton}
                data-idx={idx}
                className={style[className]}
              >
                <img
                  data-idx={idx}
                  onClick={this.activateButton}
                  height="100%"
                  src={obj.img}
                  alt="ToggleButton"
                />
              </div>);
          }
          if (obj.icon) {
            return (
              <i
                key={idx}
                style={{ lineHeight, fontSize, background }}
                onClick={this.activateButton}
                data-idx={idx}
                className={[style[className], obj.icon].join(' ')}
              />);
          }
          return null;
        })}
      </div>);
  },
});
