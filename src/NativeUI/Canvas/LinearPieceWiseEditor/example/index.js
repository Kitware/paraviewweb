import 'normalize.css';

import LinearPieceWiseEditor from '..';

const container = document.createElement('canvas');
container.setAttribute('width', 400);
container.setAttribute('height', 300);

document.body.appendChild(container);

const editor = new LinearPieceWiseEditor(container);

editor.onChange((controlPoints, envelope) => {
  console.log(controlPoints);
});

editor.setControlPoints([
  { x: 0.0, y: 0.0 },
  { x: 0.25, y: 0.75 },
  { x: 0.5, y: 0.25 },
  { x: 0.75, y: 0.5 },
  { x: 1, y: 1 },
]);
