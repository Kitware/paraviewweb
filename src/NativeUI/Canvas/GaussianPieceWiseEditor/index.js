import Monologue from 'monologue.js';

function buildGaussian(x, h, w, bx, by) {
  return { position: x, height: h, width: w, xbias: bx, ybias: by };
}

function calculateOpacities(gaussians) {
  let count = 256;
  const opacities = [];

  while (count--) {
    opacities[count] = 0.0;
  }

  gaussians.forEach(gaussian => {
    var x0;
    const { position, height, xbias, ybias } = gaussian;
    const width = gaussian.width === 0 ? 0.00001 : gaussian.width;

    for (let i = 0; i < 256; ++i) {
      const x = i / 255.0;

      // clamp non-zero values to pos +/- width
      if (x > (position + width) || x < (position - width)) {
        if (opacities[i] < 0.0) {
          opacities[i] = 0.0;
        }
        continue;
      }

      // translate the original x to a new x based on the xbias
      if (xbias === 0 || x === (position + xbias)) {
        x0 = x;
      } else if (x > (position + xbias)) {
        if (width === xbias) {
          x0 = position;
        } else {
          x0 = position + ((x - position - xbias) * (width / (width - xbias)));
        }
      } else { // (x < pos+xbias)
        if (-width === xbias) {
          x0 = position;
        } else {
          x0 = position - ((x - position - xbias) * (width / (width + xbias)));
        }
      }

      // center around 0 and normalize to -1,1
      const x1 = (x0 - position) / width;

      // do a linear interpolation between:
      //    a gaussian and a parabola        if 0<ybias<1
      //    a parabola and a step function   if 1<ybias<2
      const h0 = {
        a: Math.exp(-(4 * x1 * x1)),
        b: 1.0 - x1 * x1,
        c: 1.0,
      };

      let h2;
      if (ybias < 1) {
        h2 = height * (ybias * h0.b + (1 - ybias) * h0.a);
      } else {
        h2 = height * ((2 - ybias) * h0.b + (ybias - 1) * h0.c);
      }

      // perform the MAX over different gaussians, not the sum
      if (h2 > opacities[i]) {
        opacities[i] = h2;
      }
    }
  });

  return opacities;
}

// ----------------------------------------------------------------------------
// GaussianPieceWiseEditor
// ----------------------------------------------------------------------------

const CHANGE_TOPIC = 'GaussianPieceWiseEditor.change';

export default class GaussianPieceWiseEditor {

  constructor(canvas, style) {
    this.resetControlPoints();
    this.setStyle(style);
    this.setContainer(canvas);
  }

  resetControlPoints() {
    this.controlPoints = [ pointBuilder(0, 0), pointBuilder(1, 1) ];
    sortPoints(this.controlPoints);
  }

  setStyle({ radius = 6, stroke = 2, color = '#000000', fillColor = '#ccc' } = {}) {
    this.radius = radius;
    this.stroke = stroke;
    this.color = color;
    this.fillColor = fillColor;
  }

  setContainer(canvas) {
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onClick);
      this.canvas.removeEventListener('dblclick', this.onDblClick);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('mouseup', this.onMouseMove);
    }

    this.canvas = null;
    this.ctx = null;
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.canvas.addEventListener('click', this.onClick);
      this.canvas.addEventListener('dblclick', this.onDblClick);
      this.canvas.addEventListener('mousedown', this.onMouseDown);
      this.canvas.addEventListener('mouseleave', this.onMouseLeave);
      this.canvas.addEventListener('mouseup', this.onMouseUp);
    }
  }

  render() {
    const { width, height, margin } = getCanvasSize(this.ctx, this.radius);
    this.ctx.fillStyle = this.fillColor;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(margin, margin, width, height);

    const linearPath = [];
    this.controlPoints.forEach(point => {
      linearPath.push(getCanvasCoordinates(this.ctx, point, this.radius));
    });

    // Draw path
    this.ctx.beginPath();
    this.ctx.lineWidth = this.stroke;
    linearPath.forEach((point, idx) => {
      if (idx === 0) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    });
    this.ctx.stroke();

    // Draw control points
    linearPath.forEach(point => {
      drawControlPoint(this.ctx, point, this.radius, this.color);
    });

    // Notify control points
    this.emit(CHANGE_TOPIC, this.controlPoints);
  }

  onChange(callback) {
    return this.on(CHANGE_TOPIC, callback);
  }

  destroy() {
    this.off();
    this.setContainer(null);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(GaussianPieceWiseEditor);
