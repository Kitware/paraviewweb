import React from 'react';
import ReactDOM from 'react-dom';
import ButtonSelectorWidget from '..';

const container = document.querySelector('.content');

function process(idx, list) {
  console.log(idx, list);
}

ReactDOM.render(
  React.createElement(ButtonSelectorWidget, {
    list: [{ name: 'Choice A' }, { name: 'Choice B' }, { name: 'Choice C' }],
    onChange: process,
  }),
  container
);

container.style.margin = 0;
