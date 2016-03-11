import Monologue from 'monologue.js';

// ----------------------------------------------------------------------------
// Helper / Private functions
// ----------------------------------------------------------------------------

function pointBuilder(x, y) {
  return { x, y };
}

function clamp(value, min = 0, max = 1) {
  return value < min ? min : (value > max) ? max : value;
}

function sortPoints(pointsArray) {
  pointsArray.sort((a, b) => a.x - b.x);
  pointsArray.forEach((point, index) => {
    point.index = index;
    point.fixedX = (index === 0) || (index + 1 === pointsArray.length);
  });
  return pointsArray;
}

export function getCanvasSize(ctx, margin = 0) {
  let { width, height } = ctx.canvas;
  width -= 2 * margin;
  height -= 2 * margin;

  return { width, height, margin };
}

function getCanvasCoordinates(ctx, point, margin) {
  const { width, height } = getCanvasSize(ctx, margin);
  let { x, y } = point;
  x = Math.floor(x * width + margin + 0.5);
  y = Math.floor((1 - y) * height + margin + 0.5);
  return { x, y };
}

function drawControlPoint(ctx, point, radius, color) {
  const { x, y } = point;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

function getNormalizePosition(event, ctx, margin) {
  const { width, height } = getCanvasSize(ctx, margin);
  const rect = event.target.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left - margin) / width,
    y: 1 - (event.clientY - rect.top - margin) / height,
    epsilon: {
      x: 2 * margin / width,
      y: 2 * margin / height,
    },
  };
}

function findPoint(position, pointList) {
  const pointsFound = pointList.filter(point =>
         point.x + position.epsilon.x > position.x
      && point.x - position.epsilon.x < position.x
      && point.y + position.epsilon.y > position.y
      && point.y - position.epsilon.y < position.y
  );
  return pointsFound[0];
}

// ----------------------------------------------------------------------------
// LinearPieceWiseEditor
// ----------------------------------------------------------------------------

const CHANGE_TOPIC = 'LinearPieceWiseEditor.change';

export default class LinearPieceWiseEditor {

  constructor(canvas, style) {
    this.onMouseDown = (event) => {
      const click = getNormalizePosition(event, this.ctx, this.radius);
      const controlPoint = findPoint(click, this.controlPoints);
      this.activeControlPoint = controlPoint;
      this.canvas.addEventListener('mousemove', this.onMouseMove);
    };

    this.onMouseMove = (event) => {
      if (this.activeControlPoint) {
        const newPosition = getNormalizePosition(event, this.ctx, this.radius);
        if (!this.activeControlPoint.fixedX) {
          this.activeControlPoint.x = clamp(newPosition.x);
        }
        this.activeControlPoint.y = clamp(newPosition.y);
        sortPoints(this.controlPoints);
        this.render();
      }
    };

    this.onMouseUp = (event) => {
      this.activeControlPoint = null;
      if (this.canvas) {
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
      }
    };

    this.onMouseLeave = this.onMouseUp;

    this.onClick = (event) => {
      // Remove point
      if (event.metaKey || event.ctrlKey) {
        const click = getNormalizePosition(event, this.ctx, this.radius);
        const controlPoint = findPoint(click, this.controlPoints);
        if (controlPoint && !controlPoint.fixedX) {
          this.controlPoints.splice(controlPoint.index, 1);
        }
        this.render();
      }
    };

    this.onDblClick = (event) => {
      const point = getNormalizePosition(event, this.ctx, this.radius);
      this.controlPoints.push(point);
      sortPoints(this.controlPoints);
      this.render();
    };

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
Monologue.mixInto(LinearPieceWiseEditor);
