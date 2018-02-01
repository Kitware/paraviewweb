import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import LookupTableManager from '../../../../Common/Core/LookupTableManager';
import LookupTableWidget from '..';

// Get react component
const lookupTableManager = new LookupTableManager();
const lookupTable = lookupTableManager.addLookupTable(
  'demo',
  [-5, 15],
  'spectral'
);

document.body.style.padding = '10px';

const component = ReactDOM.render( // eslint-disable-line
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
