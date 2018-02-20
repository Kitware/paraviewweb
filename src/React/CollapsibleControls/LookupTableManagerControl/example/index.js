import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import LookupTableManager from 'paraviewweb/src/Common/Core/LookupTableManager';
import LookupTableManagerControl from 'paraviewweb/src/React/CollapsibleControls/LookupTableManagerControl';

document.body.style.padding = '10px';

// Create needed property
const lookupTableManager = new LookupTableManager();

// Add several LookupTables
lookupTableManager.addLookupTable('Temperature', [-5, 25], 'cold2warm');
lookupTableManager.addLookupTable('Pressure', [0, 15000], 'spectral');
lookupTableManager.addLookupTable('Velocity', [5, 150], 'rainbow');

// Render
ReactDOM.render(
  <LookupTableManagerControl
    field="Temperature"
    lookupTableManager={lookupTableManager}
  />,
  document.querySelector('.content')
);
