import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ContentEditableWidget from '..';

const container = document.querySelector('.content');
const html = 'initial value';

function onChange(event) {
  console.log(event.target.value, event.type);
}

ReactDOM.render(
  React.createElement(ContentEditableWidget, { html, onChange }),
  container
);

document.body.style.margin = '10px';
