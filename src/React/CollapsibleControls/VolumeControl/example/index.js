import EqualizerState from '../../../../Common/State/EqualizerState';
import LookupTableManager from '../../../../Common/Core/LookupTableManager';
import React from 'react';
import ReactDOM from 'react-dom';
import ToggleState from '../../../../Common/State/ToggleState';
import VolumeControl from '..';

// Load CSS
require('normalize.css');

const computation = new ToggleState(),
  intensity = new ToggleState(),
  equalizer = new EqualizerState({ size: 26 }),
  lookupTableManager = new LookupTableManager(),
  lookupTable = {
    originalRange: [-5, 15],
    lookupTableManager,
    lookupTable: lookupTableManager.addLookupTable(
      'demo',
      [-5, 15],
      'spectral'
    ),
  },
  container = document.querySelector('.content');

ReactDOM.render(
  React.createElement(VolumeControl, {
    computation,
    equalizer,
    intensity,
    lookupTable,
  }),
  container
);

document.body.style.margin = '10px';
