import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import LookupTableManager from 'paraviewweb/src/Common/Core/LookupTableManager';
import LookupTableWidget from 'paraviewweb/src/React/Widgets/LookupTableWidget';

// Get react component
const lookupTableManager = new LookupTableManager();
const lookupTable = lookupTableManager.addLookupTable(
  'demo',
  [-5, 15],
  'spectral'
);

document.body.style.padding = '10px';

/* eslint-disable react/no-render-return-value */
const component = ReactDOM.render(
  React.createElement(LookupTableWidget, {
    lookupTable,
    originalRange: [-5, 15],
    inverse: true,
    lookupTableManager,
  }),
  document.querySelector('.content')
);

setTimeout(() => {
  component.resetRange();
}, 500);
