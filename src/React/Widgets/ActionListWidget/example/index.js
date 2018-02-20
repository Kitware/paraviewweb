// Load CSS
import 'normalize.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ActionListWidget from 'paraviewweb/src/React/Widgets/ActionListWidget';

const container = document.querySelector('.content');
const list = [
  {
    name: 'Menu',
    action: 'something',
    data: 'CustomData...',
    icon: 'fa fa-fw fa-bars',
  },
  {
    name: 'Sub-menu',
    action: 'something else',
    icon: 'fa fa-fw fa-folder-o',
  },
  { name: 'regular', action: 'justMe', icon: 'fa fa-fw ' },
  { name: 'a', action: 'a', icon: 'fa fa-fw fa-file-o' },
  { name: 'b', action: 'b', icon: 'fa fa-fw fa-file-o' },
  { name: 'c', action: 'c', icon: 'fa fa-fw fa-file-o' },
];

function onClick(name, action, user) {
  console.log(name, action, user);
}

ReactDOM.render(
  React.createElement(ActionListWidget, { list, onClick }),
  container
);

document.body.style.margin = '10px';
