import LinearPieceWiseEditor from '..';

const container = document.createElement('canvas');
container.setAttribute('width', 400);
container.setAttribute('height', 300);

document.body.appendChild(container);

const editor = new LinearPieceWiseEditor(container);

editor.onChange((controlPoints, envelope) => {
  console.log(controlPoints);
});

editor.render();
