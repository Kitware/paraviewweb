import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import jsonData from 'paraviewweb/src/React/Widgets/QueryDataModelWidget/example/info';
import QueryDataModel from 'paraviewweb/src/IO/Core/QueryDataModel';
import QueryDataModelControl from 'paraviewweb/src/React/CollapsibleControls/QueryDataModelControl';

// Get react component
const dataModel = new QueryDataModel(jsonData, '/');

document.body.style.padding = '10px';

ReactDOM.render(
  React.createElement(QueryDataModelControl, {
    model: dataModel,
    handleExploration: true,
  }),
  document.querySelector('.content')
);
