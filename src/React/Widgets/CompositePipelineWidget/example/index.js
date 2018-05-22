import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import CompositePipelineWidget from 'paraviewweb/src/React/Widgets/CompositePipelineWidget';
import PipelineState from 'paraviewweb/src/Common/State/PipelineState';

import jsonData from 'paraviewweb/src/React/Widgets/CompositePipelineWidget/example/info';

document.body.style.padding = '10px';

const model = new PipelineState(jsonData);

/* eslint-disable react/no-render-return-value */
const component = ReactDOM.render(
  React.createElement(CompositePipelineWidget, {
    pipeline: jsonData.CompositePipeline,
    model,
  }),
  document.querySelector('.content')
);

model.onChange((data, envelope) => {
  component.forceUpdate();
});
