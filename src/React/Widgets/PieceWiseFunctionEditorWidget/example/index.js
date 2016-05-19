import React from 'react';
import ReactDOM from 'react-dom';
import PieceWiseFunctionEditorWidget from '..';

const container = document.querySelector('.content');

function onChange(list) {
  console.log(list);
}

container.style.height = "50%";
container.style.width = "50%";

ReactDOM.render(
    React.createElement(
      PieceWiseFunctionEditorWidget,
      { rangeMin: 0, rangeMax: 100, onChange }),
    container);

document.body.style.margin = '10px';
