import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import MultiViewControl from '..';

document.body.style.padding = '10px';

let layout = '2x2';
let renderMethod = 'XY';

const renderer = {
  onLayoutChange() {
    return null;
  },
  onActiveViewportChange() {
    return null;
  },

  getActiveRenderMethod() {
    return renderMethod;
  },

  getActiveLayout() {
    return layout;
  },

  setLayout(l) {
    layout = l;
    console.log('setLayout', l);
  },

  setRenderMethod(r) {
    renderMethod = r;
    console.log('setRenderMethod', r);
  },

  getRenderMethods() {
    return ['XY', 'XZ', 'YZ'];
  },
};

ReactDOM.render(
  <MultiViewControl renderer={renderer} />,
  document.querySelector('.content')
);
