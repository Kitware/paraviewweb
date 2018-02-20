import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ProxyEditorWidget from 'paraviewweb/src/React/Widgets/ProxyEditorWidget';

import source from 'paraviewweb/src/React/Widgets/ProxyEditorWidget/example/source-proxy.json';
import representation from 'paraviewweb/src/React/Widgets/ProxyEditorWidget/example/representation-proxy.json';
import view from 'paraviewweb/src/React/Widgets/ProxyEditorWidget/example/view-proxy.json';

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
