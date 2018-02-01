import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';
import equals from 'mout/src/array/equals';

import jsonData from 'tonic-arctic-sample-data/data/probe/index.json';

import MultiLayoutRenderer from '..';
import LookupTableManager from '../../../../Common/Core/LookupTableManager';
import QueryDataModel from '../../../../IO/Core/QueryDataModel';
import ImageBuilder from '../../../../Rendering/Image/DataProberImageBuilder';

const container = document.querySelector('.content');
const dataModel = new QueryDataModel(jsonData, `${__BASE_PATH__}/data/probe/`);
const lutManager = new LookupTableManager();
const imageBuilderA = new ImageBuilder(dataModel, lutManager);
const imageBuilderB = new ImageBuilder(dataModel, lutManager);
const imageBuilderC = new ImageBuilder(dataModel, lutManager);

// Configure Image builders
const field = imageBuilderA.getFields()[0];
imageBuilderA.setField(field);
imageBuilderB.setField(field);
imageBuilderC.setField(field);

imageBuilderA.setProbe(10, 10, 10);
imageBuilderB.setProbe(10, 10, 10);
imageBuilderC.setProbe(10, 10, 10);

imageBuilderA.renderMethod = 'XY';
imageBuilderB.renderMethod = 'ZY';
imageBuilderC.renderMethod = 'XZ';

imageBuilderA.update();
imageBuilderB.update();
imageBuilderC.update();

function updateProbeLocationFromA(data, envelope) {
  const builders = [imageBuilderB, imageBuilderC];

  builders.forEach((builder) => {
    if (!equals(data, builder.getProbe())) {
      builder.setProbe(data[0], data[1], data[2]);
    }
  });
}
function updateProbeLocationFromB(data, envelope) {
  const builders = [imageBuilderA, imageBuilderC];

  builders.forEach((builder) => {
    if (!equals(data, builder.getProbe())) {
      builder.setProbe(data[0], data[1], data[2]);
    }
  });
}
function updateProbeLocationFromC(data, envelope) {
  const builders = [imageBuilderA, imageBuilderB];

  builders.forEach((builder) => {
    if (!equals(data, builder.getProbe())) {
      builder.setProbe(data[0], data[1], data[2]);
    }
  });
}
imageBuilderA.onProbeChange(updateProbeLocationFromA);
imageBuilderB.onProbeChange(updateProbeLocationFromB);
imageBuilderC.onProbeChange(updateProbeLocationFromC);

// Configure container
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

container.style.width = '100%';
container.style.height = '100%';
container.style.position = 'absolute';

ReactDOM.render(
  React.createElement(MultiLayoutRenderer, {
    renderers: {
      XY: { builder: imageBuilderA, name: 'XY' },
      ZY: { builder: imageBuilderB, name: 'ZY' },
      XZ: { builder: imageBuilderC, name: 'XZ' },
    },
  }),
  container
);

dataModel.fetchData();
