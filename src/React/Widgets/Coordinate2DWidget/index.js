import equals       from 'mout/src/object/equals';
import React        from 'react';

import style        from 'PVWStyle/ReactWidgets/Coordinate2DWidget.mcss';

import MouseHandler from '../../../Interaction/Core/MouseHandler';

/*
  CoordinateControl class
  renders a canvas with a static and stationary crosshair
  with two number inputs next to it
*/

export default React.createClass({

  displayName: 'Coordinate2DWidget',

  propTypes: {
    height: React.PropTypes.number,
    hideXY: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    width: React.PropTypes.number,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      width: 50,
      height: 50,
      x: 0,
      y: 0,
    };
  },

  getInitialState() {
    return {
      x: this.props.x,
      y: this.props.y,
    };
  },

  componentDidMount() {
    this.drawControl();
    this.mouseHandler = new MouseHandler(this.canvas);
    this.mouseHandler.attach({
      click: this.pointerAction,
      mousedown: this.pointerAction,
      mouseup: this.pointerAction,
      drag: this.pointerAction,
    });
  },

  componentDidUpdate(nextProps, nextState) {
    this.drawControl();
  },

  componentWillUnmount() {
    this.mouseHandler.destroy();
  },

  coordinates() {
    return { x: this.state.x, y: this.state.y };
  },

  updateCoordinates(coords) {
    var newCoords = {},
      newVals = false;

    ['x', 'y'].forEach((el) => {
      if ({}.hasOwnProperty.call(coords, el)) {
        newCoords[el] = this.limitValue(parseFloat(coords[el]));
        newVals = true;
      }
    });

    if (newVals) {
      this.setState(newCoords);
    }
  },

  limitValue(val) {
    return Math.max(-1.0, Math.min(val, 1.0));
  },

  // no need to limit the values, for updateX/Y, the input already does that.
  updateX(e) {
    var newVal = parseFloat(e.target.value);
    this.setState({ x: newVal });
  },

  updateY(e) {
    var newVal = parseFloat(e.target.value);
    this.setState({ y: newVal });
  },

  // covers clicks, mouseup/down, and drag.
  pointerAction(e) {
    var rect = this.canvas.getBoundingClientRect();
    var x = e.pointers[0].clientX - rect.left - (this.props.width / 2),
      y = -(e.pointers[0].clientY - rect.top - (this.props.height / 2));
    this.setState({
      x: this.limitValue(x / (this.props.width / 2)),
      y: this.limitValue(y / (this.props.height / 2)),
    });
  },

  drawControl() {
    var ctx = this.canvas.getContext('2d'),
      height = ctx.canvas.height,
      width = ctx.canvas.width;

    // clear
    ctx.clearRect(0, 0, width, height);

    // draw a lightgrey center plus
    this.drawPlus('lightgrey');

    // draw a plus at {this.state.x, this.state.y},

    // convert the values to canvas coords before hand.
    this.drawPlus('black', {
      x: this.state.x * (this.props.width / 2),
      y: -this.state.y * (this.props.height / 2),
    });

    if (this.props.onChange) {
      const currentState = {
        x: this.state.x,
        y: this.state.y,
      };
      if (!equals(currentState, this.lastSharedState)) {
        this.lastSharedState = currentState;
        this.props.onChange(this.lastSharedState);
      }
    }
  },

  drawPlus(color, location_) {
    const ctx = this.canvas.getContext('2d');
    const height = ctx.canvas.height;
    const width = ctx.canvas.width;
    const lineLen = 5;
    let location = location_;

    if (location === undefined) {
      location = {
        x: width / 2,
        y: height / 2,
      };
    } else {
      location.x += this.props.width / 2;
      location.y += this.props.height / 2;
    }

    // style
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;

    // vert
    ctx.moveTo(location.x, location.y - lineLen);
    ctx.lineTo(location.x, location.y + lineLen);
    ctx.stroke();

    // horiz
    ctx.moveTo(location.x - lineLen, location.y);
    ctx.lineTo(location.x + lineLen, location.y);
    ctx.stroke();
  },

  render() {
    return (
      <section className={style.container}>
        <canvas
          ref={(c) => { this.canvas = c; }}
          className={style.canvas}
          width={this.props.width}
          height={this.props.height}
        />
        <section className={(this.props.hideXY ? style.hidden : style.inputContainer)} >
          <label className={style.inputLabel}> x: </label>
          <input
            className={style.input}
            type="number"
            onChange={this.updateX}
            min="-1.0" max="1.0" step="0.01" value={this.state.x}
          />
          <br />
          <label className={style.inputLabel}> y: </label>
          <input
            className={style.input}
            type="number"
            onChange={this.updateY}
            min="-1.0" max="1.0" step="0.01" value={this.state.y}
          />
        </section >
      </section>
    );
  },
});
