import equals       from 'mout/src/object/equals';
import React        from 'react';

import style        from 'PVWStyle/ReactViewers/LineChartViewer.mcss';

import sizeHelper   from '../../../Common/Misc/SizeHelper';


function interpolate(values, xRatio) {
  var size = values.length,
    idx = size * xRatio,
    a = values[Math.floor(idx)],
    b = values[Math.ceil(idx)],
    ratio = idx - Math.floor(idx);
  return (((b - a) * ratio) + a).toFixed(5);
}

/**
 * This React component expect the following input properties:
 */
export default React.createClass({

  displayName: 'LineChartViewer',

  propTypes: {
    colors: React.PropTypes.array,
    cursor: React.PropTypes.number,
    data: React.PropTypes.any.isRequired,
    height: React.PropTypes.number,
    legend: React.PropTypes.bool,
    width: React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      colors: [
        '#e1002a',
        '#417dc0',
        '#1d9a57',
        '#e9bc2f',
        '#9b3880',
      ],
      height: 200,
      legend: false,
      width: 200,
    };
  },

  getInitialState() {
    return {
      fieldsColors: {},
      height: this.props.height / 2,
      legend: this.props.legend,
      width: this.props.width / 2,
    };
  },

  componentWillMount() {
    this.xPosition = 0;
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChange(this.updateDimensions);

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
  },

  componentDidMount() {
    this.updateDimensions();
    // this.drawChart();
  },

  componentDidUpdate(prevProps, prevState) {
    this.drawChart();
  },

  componentWillUnmount() {
    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  },

  onMove(event) {
    this.xPosition = event.clientX - (event.target.getClientRects()[0].x || event.target.getClientRects()[0].left);

    // Update fields values

    if (this.isMounted() && this.state.legend) {
      this.drawChart();
    }
  },

  updateDimensions() {
    this.xPosition = 0;

    const el = this.rootContainer.parentNode,
      elSize = sizeHelper.getSize(el);

    if (el && (this.state.width !== elSize.clientWidth || this.state.height !== elSize.clientHeight)) {
      this.setState({
        width: elSize.clientWidth,
        height: elSize.clientHeight,
      });
      return true;
    }
    return false;
  },

  toggleLegend() {
    this.setState({ legend: !this.state.legend });
  },

  drawChart() {
    if (!this.props.data) {
      return;
    }

    const ctx = this.canvas.getContext('2d'),
      fields = this.props.data.fields,
      size = fields.length,
      fieldsColors = {},
      ratio = this.xPosition / ctx.canvas.width;

    ctx.canvas.width = this.state.width;
    ctx.canvas.height = this.state.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let idx = 0; idx < size; ++idx) {
      this.drawField(ctx, idx, fields[idx].data, fields[idx].range);
      fieldsColors[fields[idx].name] = this.props.colors[idx];
      if ({}.hasOwnProperty.call(this, fields[idx].name)) {
        this[fields[idx].name].innerHTML = interpolate(fields[idx].data, ratio);
      }
    }

    if (!equals(this.state.fieldsColors, fieldsColors)) {
      this.setState({ fieldsColors });
    }

    // Draw cursor
    if (this.state.legend) {
      this.xValueLabel.innerHTML = (
        ((this.props.data.xRange[1] - this.props.data.xRange[0]) * ratio)
        + this.props.data.xRange[0]).toFixed(5);

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.moveTo(this.xPosition, 0);
      ctx.lineTo(this.xPosition, ctx.canvas.height);
      ctx.stroke();
    }

    if (this.props.cursor !== undefined) {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#0000FF';
      ctx.moveTo(this.props.cursor * ctx.canvas.width, 0);
      ctx.lineTo(this.props.cursor * ctx.canvas.width, ctx.canvas.height);
      ctx.stroke();
    }
  },

  drawField(ctx, fieldIndex, values, range) {
    var min = Number.MAX_VALUE,
      max = Number.MIN_VALUE,
      width = ctx.canvas.width,
      height = ctx.canvas.height,
      size = values.length,
      count = values.length,
      xValues = new Uint16Array(count);

    // Compute xValues and min/max
    while (count) {
      count -= 1;
      const value = values[count];
      min = Math.min(min, value);
      max = Math.max(max, value);
      xValues[count] = Math.floor(width * (count / size));
    }

    // Update range if any provided
    if (range) {
      min = range[0];
      max = range[1];
    }

    const scaleY = height / (max - min);

    function getY(idx) {
      var value = values[idx];
      value = (value > min) ? ((value < max) ? value : max) : min;
      return height - Math.floor((value - min) * scaleY);
    }

    // Draw line
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.props.colors[fieldIndex];
    ctx.moveTo(xValues[0], getY(0));
    for (let idx = 1; idx < size; idx++) {
      if (isNaN(values[idx])) {
        if (idx + 1 < size && !isNaN(values[idx + 1])) {
          ctx.moveTo(xValues[idx + 1], getY(idx + 1));
        }
      } else {
        ctx.lineTo(xValues[idx], getY(idx));
      }
    }
    ctx.stroke();

    return [min, max];
  },

  render() {
    var legend = [];

    Object.keys(this.state.fieldsColors).forEach((name) => {
      const color = this.state.fieldsColors[name];
      legend.push(
        <li className={style.legendItem} key={name}>
          <i className={style.legendItemColor} style={{ color }} />
          <b>{name}</b>
          <span className={style.legendItemValue} ref={(c) => { this[name] = c; }} />
        </li>);
    });

    return (
      <div className={style.container} ref={c => (this.rootContainer = c)}>
        <canvas
          className={style.canvas}
          ref={(c) => { this.canvas = c; }}
          onMouseMove={this.onMove}
          width={this.state.width}
          height={this.state.height}
        />
        <div className={this.state.legend ? style.legend : style.hidden}>
          <div className={style.legendBar}>
            <span className={style.legendText} ref={(c) => { this.xValueLabel = c; }} />
            <i className={style.toggleLegendButton} onClick={this.toggleLegend} />
          </div>
          <ul className={style.legendContent}>
            {legend}
          </ul>
        </div>
        <div className={this.state.legend ? style.hidden : style.legend} onClick={this.toggleLegend}>
          <div className={style.legendButtons}>
            <i className={style.toggleLegendButton} />
          </div>
        </div>
      </div>
    );
  },
});
