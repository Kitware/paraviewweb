import Monologue from 'monologue.js';

const PAINTER_READY = 'painter-ready';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function paintField(ctx, location, field, range) {
  var count,
    min = Number.MAX_VALUE,
    max = Number.MIN_VALUE;

  const
    xOffset = location.x,
    yOffset = location.y,
    width = location.width,
    height = location.height,
    values = field.data,
    size = values.length,
    xValues = new Uint16Array(size);

  // Compute xValues and min/max
  count = size;
  while (count) {
    count -= 1;
    const value = values[count];
    min = Math.min(min, value);
    max = Math.max(max, value);
    xValues[count] = xOffset + Math.floor(width * (count / (size - 1)));
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
    return (yOffset + height) - Math.floor((value - min) * scaleY);
  }

  // Draw line
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = field.color;
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
}

// ----------------------------------------------------------------------------

function paintMarker(ctx, location, xRatio, color) {
  if (xRatio < 0 || xRatio > 1) {
    return;
  }

  const y1 = location.y,
    y2 = y1 + location.height,
    x = location.x + Math.floor(xRatio * location.width);

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
}

// ----------------------------------------------------------------------------

function paintText(ctx, location, xOffset, yOffset, text, color = '#000000') {
  ctx.fillStyle = color;
  ctx.font = '20px serif';
  ctx.textBaseline = 'top';
  ctx.fillText(text, location.x + xOffset, location.y + yOffset);
}

// ----------------------------------------------------------------------------

// function interpolate(values, xRatio) {
//     var size = values.length,
//         idx = size * xRatio,
//         a = values[Math.floor(idx)],
//         b = values[Math.ceil(idx)],
//         ratio = idx - Math.floor(idx);
//     return ((b-a)*ratio + a).toFixed(5);
// }

// ----------------------------------------------------------------------------

export default class LineChartPainter {

  constructor(title, markerColor = '#0000FF', colors = ['#e1002a', '#417dc0', '#1d9a57', '#e9bc2f', '#9b3880']) {
    this.data = null;
    this.colors = colors;
    this.markerColor = markerColor;
    this.markerLocation = -1;
    this.showMarker = true;
    this.title = title;
    this.fillBackground = null;
    this.controlWidgets = [];
  }

  // ----------------------------------------------------------------------------
  // Expected data structure
  // {
  //      xRange: [ 0 , 100],
  //      fields: [
  //          { name: 'Temperature', data: [y0, y1, ..., yn], range: [0, 1]},
  //          ...
  //      ]
  // }

  updateData(data) {
    var colorIdx = 0;

    // Keep data
    this.data = data;

    // Assign color if no color
    data.fields.forEach((field) => {
      if (!field.color) {
        field.color = this.colors[colorIdx % this.colors.length];
        colorIdx += 1;
      }
    });

    this.emit(PAINTER_READY, this);
  }

  // ----------------------------------------------------------------------------

  setBackgroundColor(color) {
    this.fillBackground = color;
  }

  // ----------------------------------------------------------------------------

  setTitle(title) {
    this.title = title;
    this.emit(PAINTER_READY, this);
  }

  // ----------------------------------------------------------------------------

  setMarkerLocation(xRatio) {
    this.markerLocation = xRatio;

    this.emit(PAINTER_READY, this);
  }

  // ----------------------------------------------------------------------------

  enableMarker(show) {
    if (this.showMarker !== show) {
      this.showMarker = show;
      this.emit(PAINTER_READY, this);
    }
  }

  // ----------------------------------------------------------------------------

  isReady() {
    return (this.data !== null);
  }

  // ----------------------------------------------------------------------------

  paint(ctx, location) {
    var xValue = '?';

    if (!this.data) {
      return;
    }

    // Empty content
    ctx.clearRect(location.x - 1, location.y - 1, location.width + 2, location.height + 2);

    if (this.fillBackground) {
      ctx.fillStyle = this.fillBackground;
      ctx.fillRect(location.x, location.y, location.width, location.height);
    }

    // Paint each field
    this.data.fields.forEach((field) => {
      if (field.active === undefined || field.active) {
        paintField(ctx, location, field, field.range);
      }
    });

    // Paint marker if any
    if (this.showMarker) {
      paintMarker(ctx, location, this.markerLocation, this.markerColor);
    }

    // Paint tile if any
    if (this.title) {
      if (this.data.xRange && this.data.xRange.length === 2 && !isNaN(this.markerLocation)) {
        xValue = (((this.data.xRange[1] - this.data.xRange[0]) * this.markerLocation) + this.data.xRange[0]);
        if (xValue.toFixed) {
          xValue = xValue.toFixed(5);
        }
      }
      paintText(ctx, location, 10, 10, this.title.replace(/{x}/g, `${xValue}`));
    }
  }

  // ----------------------------------------------------------------------------

  onPainterReady(callback) {
    return this.on(PAINTER_READY, callback);
  }

  // ----------------------------------------------------------------------------
  // Method meant to be used with the WidgetFactory

  getControlWidgets() {
    return this.controlWidgets;
  }

}

Monologue.mixInto(LineChartPainter);
