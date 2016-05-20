import React from 'react';
import ReactDOM from 'react-dom';
import ColorMapEditorWidget from '..';

const container = document.querySelector('.content');

import presets from './presets.json';

function somethingChanged(name, x) {
  console.log(name);
  if (x) {
    console.log(x);
  }
}

const onOpacityTransferFunctionChanged = somethingChanged.bind(undefined, 'OTF');
const onPresetChanged = somethingChanged.bind(undefined, 'Preset');
const onRangeEdited = somethingChanged.bind(undefined, 'Range');
const onScaleRangeToCurrent = somethingChanged.bind(undefined, 'RangeToCurrent');
const onScaleRangeOverTime = somethingChanged.bind(undefined, 'RangeOverTime');

container.style.height = "50%";
container.style.width = "50%";

ReactDOM.render(
    React.createElement(
      ColorMapEditorWidget,
      {
        initialPreset: 'Cool to Warm',
        initialRange: [ 0, 100 ],
        presets,
        dataRangeMin: 0,
        dataRangeMax: 100,
        onOpacityTransferFunctionChanged,
        onPresetChanged,
        onRangeEdited,
        onScaleRangeToCurrent,
        onScaleRangeOverTime,
      }),
    container);

document.body.style.margin = '10px';

