import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import Coordinate2DWidget from 'paraviewweb/src/React/Widgets/Coordinate2DWidget';

const height = 100;
const width = 100;

ReactDOM.render(
  React.createElement(Coordinate2DWidget, {
    height,
    width,
    onChange: console.log,
    hideXY: true,
  }),
  document.querySelector('.content')
);
