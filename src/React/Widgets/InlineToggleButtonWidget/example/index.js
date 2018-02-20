import 'normalize.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import { render } from 'react-dom';

import InlineToggleButtonWidget from 'paraviewweb/src/React/Widgets/InlineToggleButtonWidget';
import logo from 'paraviewweb/documentation/images/ui.png';

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
