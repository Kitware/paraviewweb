import CompositePipelineWidget from '..';
import PipelineState from '../../../../Common/State/PipelineState';
import React from 'react';
import ReactDOM from 'react-dom';
import jsonData from './info.js';

// Load CSS
require('normalize.css');
document.body.style.padding = '10px';

const model = new PipelineState(jsonData);

const component = ReactDOM.render(
  React.createElement(CompositePipelineWidget, {
    pipeline: jsonData.CompositePipeline,
    model,
  }),
  document.querySelector('.content')
);

model.onChange(function(data, envelope) {
  component.forceUpdate();
});
