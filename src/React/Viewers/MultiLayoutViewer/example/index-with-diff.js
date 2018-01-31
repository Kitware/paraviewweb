import React from 'react';
import ReactDOM from 'react-dom';

import ImageBuilder from '../../../../Rendering/Image/DataProberImageBuilder';
import PixelOperatorImageBuilder from '../../../../Rendering/Image/PixelOperatorImageBuilder';
import LookupTableManager from '../../../../Common/Core/LookupTableManager';
import MultiLayoutViewer from '..';
import QueryDataModel from '../../../../IO/Core/QueryDataModel';
import jsonData from 'tonic-arctic-sample-data/data/probe/index.json';

// Load CSS
require('normalize.css');

/* global __BASE_PATH__ */
const bodyElement = document.querySelector('.content'),
  dataModelA = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/probe/'),
  dataModelB = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/probe/'),
  dataModelC = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/probe/'),
  lutManager = new LookupTableManager(),
  imageBuilderA = new ImageBuilder(dataModelA, lutManager),
  imageBuilderB = new ImageBuilder(dataModelB, lutManager),
  imageBuilderC = new ImageBuilder(dataModelC, lutManager),
  diffImageBuilder = new PixelOperatorImageBuilder();

// Handling Diff computation
imageBuilderA.onImageReady(function(data, envelope) {
  diffImageBuilder.updateData('a', data);
});
imageBuilderB.onImageReady(function(data, envelope) {
  diffImageBuilder.updateData('b', data);
});
imageBuilderC.onImageReady(function(data, envelope) {
  diffImageBuilder.updateData('c', data);
});

function updateCrosshairVisibility(data, envelope) {
  var builders = [imageBuilderA, imageBuilderB, imageBuilderC];

  builders.forEach(function(builder) {
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
