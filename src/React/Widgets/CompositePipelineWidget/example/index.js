import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import CompositePipelineWidget from '..';
import PipelineState from '../../../../Common/State/PipelineState';

import jsonData from './info';

document.body.style.padding = '10px';

const model = new PipelineState(jsonData);

const component = ReactDOM.render( // eslint-disable-line
  React.createElement(CompositePipelineWidget, {
    pipeline: jsonData.CompositePipeline,
    model,
  }),
  document.querySelector('.content')
);

model.onChange((data, envelope) => {
  component.forceUpdate();
});
