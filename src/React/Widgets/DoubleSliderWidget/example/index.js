import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import DoubleSliderWidget from 'paraviewweb/src/React/Widgets/DoubleSliderWidget';

function onChange(name, value) {
  console.log(name, value);
}

ReactDOM.render(
  React.createElement(DoubleSliderWidget, {
    name: 'sample',
    min: '0',
    max: '100',
    value: 50,
    onChange,
  }),
  document.querySelector('.content')
);
