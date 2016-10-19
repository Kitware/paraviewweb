/* global document */
import 'babel-polyfill';
import React                from 'react';
import ReactDOM             from 'react-dom';
import AnnotationEditorWidget from '..';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';
import AnnotationBuilder from '../../../../Common/Misc/AnnotationBuilder';

import LegendProvider from '../../../../InfoViz/Core/LegendProvider';

// Load CSS
require('normalize.css');

const scores = [
  { name: 'Yes', color: '#00C900', value: 100 },
  { name: 'Maybe', color: '#FFFF00', value: 0 },
  { name: 'No', color: '#C90000', value: -Number.MAX_VALUE },
];

const rangeSelection = SelectionBuilder.range({
  pressure: [
    { interval: [0, 101.3], endpoints: 'oo', uncertainty: 15 },
    { interval: [200, 400], endpoints: '*o', uncertainty: 30 },
  ],
  temperature: [
    { interval: [233, Number.MAX_VALUE], endpoints: 'oo', uncertainty: 15 },
  ],
});

const partitionSelection = SelectionBuilder.partition('pressure', [
  { value: 90, uncertainty: 0 },
  { value: 101.3, uncertainty: 10 },
  { value: 200, uncertainty: 40, closeToLeft: true },
]);
const ranges = {
  pressure: [0, 600],
  temperature: [-270, 1000],
};

const annotations = [
  AnnotationBuilder.annotation(rangeSelection, [0]),
  AnnotationBuilder.annotation(partitionSelection, [1, 0, 1, 2]),
  AnnotationBuilder.annotation(SelectionBuilder.convertToRuleSelection(rangeSelection), [1]),
];
const legendService = LegendProvider.newInstance({ legendEntries: ['pressure', 'temperature'] });

// Get react component
document.body.style.padding = '10px';

function render() {
  ReactDOM.render(
    <div>
      {annotations.map((annotation, idx) =>
        <div key={idx}>
          <AnnotationEditorWidget
            scores={scores}
            ranges={ranges}
            annotation={annotation}
            getLegend={legendService.getLegend}
            // rationaleOpen={true}
            onChange={(newAnnotation, save) => {
              annotations[idx] = newAnnotation;
              if (save) {
                console.log('Push annotation', newAnnotation.generation, newAnnotation);
              }
              render();
            }}
          />
          <hr />
        </div>
      )}
    </div>,
    document.querySelector('.content'));
}

render();
