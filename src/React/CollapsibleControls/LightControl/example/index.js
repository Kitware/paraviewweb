import LightControl from '..';
import React from 'react';
import ReactDOM from 'react-dom';

// Load CSS
require('normalize.css');

document.body.style.padding = '10px';

const state = {
    enabled: true,
    properties: {
      lightTerms: {
        ka: 1,
        kd: 0.3,
        ks: 0.5,
        alpha: 0,
      },
      lightPosition: {
        x: 0,
        y: 0,
      },
    },
  },
  light = {
    getLightProperties() {
      return state.properties;
    },
    setLightProperties({ lightTerms, lightPosition }) {
      if (lightPosition) {
        state.properties.lightPosition = lightPosition;
        console.log(lightPosition);
      }
      if (lightTerms) {
        state.properties.lightTerms = lightTerms;
        console.log(lightTerms);
      }
    },
    setLightingEnabled(e) {
      console.log('enable', e);
      state.enabled = e;
    },
    getLightingEnabled() {
      return state.enabled;
    },
  };

ReactDOM.render(
  <LightControl light={light} />,
  document.querySelector('.content')
);
