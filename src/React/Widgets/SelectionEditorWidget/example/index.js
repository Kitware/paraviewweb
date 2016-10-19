/* global document */
import 'babel-polyfill';
import React                from 'react';
import ReactDOM             from 'react-dom';
import SelectionEditorWidget from '..';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

import LegendProvider from '../../../../InfoViz/Core/LegendProvider';

// Load CSS
require('normalize.css');

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


const selectionTypes = [rangeSelection, partitionSelection, SelectionBuilder.convertToRuleSelection(rangeSelection)];
const legendService = LegendProvider.newInstance({ legendEntries: ['pressure', 'temperature'] });

// Get react component
document.body.style.padding = '10px';

function render() {
  ReactDOM.render(
    <div>
      {selectionTypes.map((selection, idx) =>
        <SelectionEditorWidget
          key={idx}
          selection={selection}
          ranges={ranges}
          getLegend={legendService.getLegend}
          onChange={(newSelection, save) => {
            selectionTypes[idx] = newSelection;
            if (save) {
              console.log('Push selection', newSelection.generation, newSelection);
            }
            render();
          }}
        />
      )}
    </div>,
    document.querySelector('.content'));
}

render();
