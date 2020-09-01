import equals from 'mout/src/object/equals';
import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactViewers/LineChartViewer.mcss';

import sizeHelper from '../../../Common/Misc/SizeHelper';

function interpolate(values, xRatio) {
  const size = values.length;
  const idx = size * xRatio;
  const a = values[Math.floor(idx)];
  const b = values[Math.ceil(idx)];
  const ratio = idx - Math.floor(idx);
  return ((b - a) * ratio + a).toFixed(5);
}

/**
 * This React component expect the following input properties:
 */
export default class LineChartViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldsColors: {},
      height: props.height / 2,
      legend: props.legend,
      width: props.width / 2,
    };

    // Bind callback
    this.onMove = this.onMove.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.toggleLegend = this.toggleLegend.bind(this);
    this.drawChart = this.drawChart.bind(this);
    this.drawField = this.drawField.bind(this);
  }

  componentWillMount() {
    this.xPosition = 0;
  }

  componentDidMount() {
    this.isReady = true;
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChangeForElement(
      this.rootContainer.parentNode,
      this.updateDimensions
    );

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
    this.updateDimensions();
    // this.drawChart();
  }

  componentDidUpdate(prevProps, prevState) {
    this.drawChart();
  }

  componentWillUnmount() {
    this.isReady = false;
    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  }

  onMove(event) {
    this.xPosition =
      event.clientX -
      (event.target.getClientRects()[0].x ||
        event.target.getClientRects()[0].left);

    // Update fields values

    if (this.isReady && this.state.legend) {
      this.drawChart();
    }
  }

  updateDimensions() {
    this.xPosition = 0;

    const el = this.rootContainer.parentNode;
    const elSize = sizeHelper.getSize(el);

    if (
      el &&
      (this.state.width !== elSize.clientWidth ||
        this.state.height !== elSize.clientHeight)
    ) {
      this.setState({
        width: elSize.clientWidth,
        height: elSize.clientHeight,
      });
      return true;
    }
    return false;
  }

  toggleLegend() {
    this.setState({ legend: !this.state.legend });
  }

  drawChart() {
    if (!this.props.data) {
      return;
    }

    const ctx = this.canvas.getContext('2d');
    const fields = this.props.data.fields;
    const size = fields.length;
    const fieldsColors = {};
    const ratio = this.xPosition / ctx.canvas.width;

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
        (this.props.data.xRange[1] - this.props.data.xRange[0]) * ratio +
        this.props.data.xRange[0]
      ).toFixed(5);

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
  }

  drawField(ctx, fieldIndex, values, range) {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const size = values.length;
    let count = values.length;
    const xValues = new Uint16Array(count);

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
      let value = values[idx];
      value = value > min ? (value < max ? value : max) : min;
      return height - Math.floor((value - min) * scaleY);
    }

    // Draw line
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.props.colors[fieldIndex];
    ctx.moveTo(xValues[0], getY(0));
    for (let idx = 1; idx < size; idx++) {
      if (Number.isNaN(values[idx])) {
        if (idx + 1 < size && !Number.isNaN(values[idx + 1])) {
          ctx.moveTo(xValues[idx + 1], getY(idx + 1));
        }
      } else {
        ctx.lineTo(xValues[idx], getY(idx));
      }
    }
    ctx.stroke();

    return [min, max];
  }

  render() {
    const legend = [];

    Object.keys(this.state.fieldsColors).forEach((name) => {
      const color = this.state.fieldsColors[name];
      legend.push(
        <li className={style.legendItem} key={name}>
          <i className={style.legendItemColor} style={{ color }} />
          <b>{name}</b>
          <span
            className={style.legendItemValue}
            ref={(c) => {
              this[name] = c;
            }}
          />
        </li>
      );
    });

    return (
      <div
        className={style.container}
        ref={(c) => {
          this.rootContainer = c;
        }}
      >
        <canvas
          className={style.canvas}
          ref={(c) => {
            this.canvas = c;
          }}
          onMouseMove={this.onMove}
          width={this.state.width}
          height={this.state.height}
        />
        <div className={this.state.legend ? style.legend : style.hidden}>
          <div className={style.legendBar}>
            <span
              className={style.legendText}
              ref={(c) => {
                this.xValueLabel = c;
              }}
            />
            <i
              className={style.toggleLegendButton}
              onClick={this.toggleLegend}
            />
          </div>
          <ul className={style.legendContent}>{legend}</ul>
        </div>
        <div
          className={this.state.legend ? style.hidden : style.legend}
          onClick={this.toggleLegend}
        >
          <div className={style.legendButtons}>
            <i className={style.toggleLegendButton} />
          </div>
        </div>
      </div>
    );
  }
}

LineChartViewer.propTypes = {
  colors: PropTypes.array,
  cursor: PropTypes.number,
  data: PropTypes.any.isRequired,
  height: PropTypes.number,
  legend: PropTypes.bool,
  width: PropTypes.number,
};

LineChartViewer.defaultProps = {
  colors: ['#e1002a', '#417dc0', '#1d9a57', '#e9bc2f', '#9b3880'],
  height: 200,
  legend: false,
  width: 200,
  cursor: undefined,
};
