import SelectionEditorWidget from '..';
import React                from 'react';
import ReactDOM             from 'react-dom';
// import jsonData             from './info.js';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';
// import FieldProvider from '../../../../InfoViz/Core/FieldProvider';
import LegendProvider from '../../../../InfoViz/Core/LegendProvider';

// Load CSS
require('normalize.css');

const legendEntries = [
  'pressure',
  'temperature',
];
const legend = LegendProvider.newInstance({ legendEntries });

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
  { value: 101.3, uncertainty: 20 },
  { value: 200, uncertainty: 40, closeToLeft: true },
]);

const jsonData = [SelectionBuilder.convertToRuleSelection(rangeSelection), SelectionBuilder.convertToRuleSelection(partitionSelection)];
console.log('rangeSelection', JSON.stringify(rangeSelection, null, 2));
console.log('to rule: rangeSelection', JSON.stringify(jsonData[0], null, 2));
/*
rangeSelection {
  "type": "range",
  "generation": 1,
  "range": {
    "variables": {
      "pressure": [
        {
          "interval": [
            0,
            101.3
          ],
          "endpoints": "oo",
          "uncertainty": 15
        },
        {
          "interval": [
            200,
            400
          ],
          "endpoints": "*o",
          "uncertainty": 30
        }
      ],
      "temperature": [
        {
          "interval": [
            233,
            1.7976931348623157e+308
          ],
          "endpoints": "oo",
          "uncertainty": 15
        }
      ]
    }
  }
}

to rule: rangeSelection {
  "type": "rule",
  "generation": 3,
  "rule": {
    "type": "logical",
    "terms": [
      "and",
      {
        "type": "logical",
        "terms": [
          "or",
          {
            "type": "5C",
            "terms": [
              0,
              "<",
              "pressure",
              "<",
              101.3
            ]
          },
          {
            "type": "5C",
            "terms": [
              200,
              "<=",
              "pressure",
              "<",
              400
            ]
          }
        ]
      },
      {
        "type": "5C",
        "terms": [
          233,
          "<",
          "temperature",
          "<",
          1.7976931348623157e+308
        ]
      }
    ],
    "roles": []
  }
}

*/
// Get react component

document.body.style.padding = '10px';

ReactDOM.render(
    React.createElement(
        SelectionEditorWidget,
        { selections: jsonData,
          legendService: legend,
        }),
    document.querySelector('.content')
);
