import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import QueryDataModel from 'paraviewweb/src/IO/Core/QueryDataModel';
import QueryDataModelWidget from 'paraviewweb/src/React/Widgets/QueryDataModelWidget';

import jsonData from 'paraviewweb/src/React/Widgets/QueryDataModelWidget/example/info';

// Get react component
const dataModel = new QueryDataModel(jsonData, '/');
document.body.style.padding = '10px';

ReactDOM.render(
  React.createElement(QueryDataModelWidget, { model: dataModel }),
  document.querySelector('.content')
);
