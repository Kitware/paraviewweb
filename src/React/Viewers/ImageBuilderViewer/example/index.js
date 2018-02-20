import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import jsonData from 'tonic-arctic-sample-data/data/earth/index.json';

import ImageBuilderViewer from 'paraviewweb/src/React/Viewers/ImageBuilderViewer';
import QueryDataModel from 'paraviewweb/src/IO/Core/QueryDataModel';
import ImageBuilder from 'paraviewweb/src/Rendering/Image/QueryDataModelImageBuilder';

// Make sure the widget factory has the widget needed by this example
import 'paraviewweb/src/React/CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const queryDataModel = new QueryDataModel(
  jsonData,
  `${__BASE_PATH__}/data/earth/`
);
const imageBuilder = new ImageBuilder(queryDataModel);

ReactDOM.render(
  React.createElement(ImageBuilderViewer, { queryDataModel, imageBuilder }),
  document.querySelector('.content')
);

queryDataModel.fetchData();
