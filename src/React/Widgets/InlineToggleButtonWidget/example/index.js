import InlineToggleButtonWidget from '..';
import React from 'react';
import { render } from 'react-dom';

// Load CSS
require('font-awesome/css/font-awesome.css');
require('normalize.css');
const logo = require('../../../../../documentation/images/ui.png');

function onChange(obj, idx) {
  console.log('Active', obj, idx);
}

render(
  React.createElement(InlineToggleButtonWidget, {
    activeColor: 'red',
    defaultColor: 'green',
    height: '0.75em',
    options: [
      { label: 'First' },
      { label: 'A' },
      { label: 'B' },
      { label: 'C' },
      { img: logo },
      { icon: 'fa fa-twitter' },
      { label: 'Last' },
    ],
    onChange,
  }),
  document.querySelector('.content')
);
