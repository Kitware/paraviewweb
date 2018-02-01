import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ProxyEditorWidget from '..';

import source from './source-proxy.json';
import representation from './representation-proxy.json';
import view from './view-proxy.json';

// --------------------------------------------------------------------------
// Main proxy editor widget example
// --------------------------------------------------------------------------
const container = document.querySelector('.content');
const sections = [
  Object.assign({ name: 'source', collapsed: false }, source),
  Object.assign({ name: 'representation', collapsed: true }, representation),
  Object.assign({ name: 'view', collapsed: true }, view),
];

ReactDOM.render(
  React.createElement(ProxyEditorWidget, { sections }),
  container
);

document.body.style.margin = '10px';
