import SelectionEditorWidget from '..';
import React                from 'react';
import ReactDOM             from 'react-dom';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

import CompositeClosureHelper from '../../../../Common/Core/CompositeClosureHelper';
// import FieldProvider from '../../../../InfoViz/Core/FieldProvider';
import LegendProvider from '../../../../InfoViz/Core/LegendProvider';
import SelectionProvider from '../../../../InfoViz/Core/SelectionProvider';

// Load CSS
require('normalize.css');

const legendEntries = [
  'pressure',
  'temperature',
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
  { value: 101.3, uncertainty: 20 },
  { value: 200, uncertainty: 40, closeToLeft: true },
]);

const jsonData = [rangeSelection, SelectionBuilder.convertToRuleSelection(rangeSelection), partitionSelection];
// console.log('partitionSelection', JSON.stringify(partitionSelection, null, 2));

const dataModel = {
  legendEntries,
};

const provider = CompositeClosureHelper.newInstance((publicAPI, model, initialValues = {}) => {
  Object.assign(model, initialValues);
  // FieldProvider.extend(publicAPI, model, initialValues);
  LegendProvider.extend(publicAPI, model, initialValues);
  SelectionProvider.extend(publicAPI, model, initialValues);
})(dataModel);

let currSel = 0;
// provider.setSelection(JSON.parse(JSON.stringify(jsonData[currSel])));
provider.setSelection(jsonData[currSel]);

// Demo - reset if we delete the selection
provider.onSelectionChange(sel => {
  if (sel.type === 'empty') {
    window.setTimeout(() => {
      currSel = (currSel + 1) % jsonData.length;
      provider.setSelection(jsonData[currSel]);
    }, 2000);
  }
});

// Get react component

document.body.style.padding = '10px';

ReactDOM.render(
  React.createElement(
    SelectionEditorWidget,
    {
      provider,
    }),
  document.querySelector('.content')
);
