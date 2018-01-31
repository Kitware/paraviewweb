import FloatImageControl from '..';
import React from 'react';
import ReactDOM from 'react-dom';
import jsonData from './pipeline.js';

// Load CSS
require('normalize.css');

document.body.style.padding = '10px';

const layerMapByName = {},
  state = {
    light: 200,
  },
  model = {
    dimensions: jsonData.dimensions,
    onProbeChange() {
      return null;
    },
    getTimeProbe() {
      return {
        enabled: false,
        query: null,
        draw: false,
      };
    },
    getLayers() {
      return jsonData.layers;
    },
    getLight() {
      return state.light;
    },
    setLight(v) {
      state.light = v;
    },
    isMultiView() {
      return false;
    },
    updateMaskLayerVisibility(name, value) {
      layerMapByName[name].meshActive = value;
      render();
    },
    updateLayerVisibility(name, value) {
      layerMapByName[name].active = value;
      render();
    },
    updateLayerColorBy(name, value) {
      layerMapByName[name].array = value;
      render();
    },
  };

// Fill map
jsonData.layers.forEach((item) => {
  layerMapByName[item.name] = item;
});

// Keep element for rerendering it
const element = <FloatImageControl model={model} />;

function render() {
  ReactDOM.render(element, document.querySelector('.content'));
}

render();
