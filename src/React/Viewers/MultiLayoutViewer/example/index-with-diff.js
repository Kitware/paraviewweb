import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import jsonData from 'tonic-arctic-sample-data/data/probe/index.json';

import ImageBuilder from 'paraviewweb/src/Rendering/Image/DataProberImageBuilder';
import PixelOperatorImageBuilder from 'paraviewweb/src/Rendering/Image/PixelOperatorImageBuilder';
import LookupTableManager from 'paraviewweb/src/Common/Core/LookupTableManager';
import MultiLayoutViewer from 'paraviewweb/src/React/Viewers/MultiLayoutViewer';
import QueryDataModel from 'paraviewweb/src/IO/Core/QueryDataModel';

const bodyElement = document.querySelector('.content');
const dataModelA = new QueryDataModel(jsonData, `${__BASE_PATH__}/data/probe/`);
const dataModelB = new QueryDataModel(jsonData, `${__BASE_PATH__}/data/probe/`);
const dataModelC = new QueryDataModel(jsonData, `${__BASE_PATH__}/data/probe/`);
const lutManager = new LookupTableManager();
const imageBuilderA = new ImageBuilder(dataModelA, lutManager);
const imageBuilderB = new ImageBuilder(dataModelB, lutManager);
const imageBuilderC = new ImageBuilder(dataModelC, lutManager);
const diffImageBuilder = new PixelOperatorImageBuilder();

// Handling Diff computation
imageBuilderA.onImageReady((data, envelope) => {
  diffImageBuilder.updateData('a', data);
});
imageBuilderB.onImageReady((data, envelope) => {
  diffImageBuilder.updateData('b', data);
});
imageBuilderC.onImageReady((data, envelope) => {
  diffImageBuilder.updateData('c', data);
});

function updateCrosshairVisibility(data, envelope) {
  const builders = [imageBuilderA, imageBuilderB, imageBuilderC];

  builders.forEach((builder) => {
    builder.setCrossHairEnable(data);
  });
}

imageBuilderA.onCrosshairVisibilityChange(updateCrosshairVisibility);
imageBuilderB.onCrosshairVisibilityChange(updateCrosshairVisibility);
imageBuilderC.onCrosshairVisibilityChange(updateCrosshairVisibility);

// Create UI element
ReactDOM.render(
  React.createElement(MultiLayoutViewer, {
    queryDataModel: dataModelA,
    renderers: {
      a: { builder: imageBuilderA, name: 'a' },
      b: { builder: imageBuilderB, name: 'b' },
      c: { builder: imageBuilderC, name: 'c' },
      Operation: { builder: diffImageBuilder, name: 'Operation' },
    },
  }),
  bodyElement
);

dataModelA.fetchData();
dataModelB.fetchData();
dataModelC.fetchData();
