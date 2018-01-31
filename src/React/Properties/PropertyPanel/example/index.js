/* global document */
import React from 'react';
import ReactDOM from 'react-dom';
import PropertyPanel from '..';

// Load CSS
require('normalize.css');

const container = document.querySelector('.content');
let currVal = 1;
let currVal3 = ['pasta', 'cheese'];
let currValCheck = [true, false];
let currValSlider = 0.3;
let currValCell = [2, 3.5];

function render() {
  const properties1 = {
    data: { value: currVal, id: 'enum.property.id' },
    // help: 'Dynamic property list',
    name: 'enum',
    onChange: function onChange(data) {
      console.log(JSON.stringify(data));
      currVal = data.value[0];
      render();
    },
    show: () => true,
    ui: {
      propType: 'enum',
      label: 'Enum List',
      help: 'Choose one or multiple, if configured',
      domain: { one: 1, two: 2, three: 3, four: 4 },
      type: 'int',
    },
  };
  const properties3 = {
    data: { value: currVal3, id: 'enum.property.id3' },
    name: 'enum',
    onChange: function onChange(data) {
      console.log(data.value);
      currVal3 = data.value;
      render();
    },
    show: () => true,
    ui: {
      propType: 'enum',
      label: 'Multi-select list',
      help: 'Choose multiple food items',
      domain: {
        pasta: 'pasta',
        salad: 'salad',
        bread: 'bread',
        cheese: 'cheese',
        wine: 'wine',
        dessert: 'dessert',
      },
      type: 'string',
      size: -1,
    },
  };
  const propertiesCheck = {
    data: { value: currValCheck, id: 'checkbox.property.id2' },
    name: 'checkbox2',
    onChange: function onChange(data) {
      console.log(JSON.stringify(data));
      currValCheck = data.value;
      render();
    },
    show: () => true,
    ui: {
      propType: 'checkbox',
      componentLabels: ['first', 'second'],
      label: 'Checkbox list',
      help: 'Pick and choose',
    },
  };

  const propSlider = {
    data: { value: currValSlider, id: 'slider.property.id4' },
    name: 'slider',
    onChange: function onChange(data) {
      console.log(JSON.stringify(data));
      currValSlider = data.value;
      render();
    },
    show: () => true,
    ui: {
      propType: 'slider',
      label: 'Number input',
      help: 'Set a numeric value',
      domain: { min: -1, max: 2 },
      type: 'double',
    },
  };

  const propCell = {
    data: { value: currValCell, id: 'cell.property.id5' },
    name: 'cell',
    onChange: function onChange(data) {
      console.log(JSON.stringify(data));
      currValCell = data.value;
      render();
    },
    show: () => true,
    ui: {
      propType: 'cell',
      // set layout to '-1' for a growable list without component labels:
      layout: '2',
      label: 'Text/numeric input table',
      componentLabels: ['first', 'second'],
      help: 'Set some values',
      domain: { range: [{ min: -10, max: 20, force: true }] },
      type: 'double',
    },
  };

  const properties = {
    input: [
      {
        title: 'Property Panel',
        contents: [
          properties1,
          properties3,
          propertiesCheck,
          propSlider,
          propCell,
        ],
      },
    ],
    // setting this change handler overrides all individual component change handlers.
    // onChange: function onChange(data) {
    //   console.log(JSON.stringify(data));
    //   render();
    // },
    viewData: {},
  };

  ReactDOM.render(
    <div>
      <PropertyPanel {...properties} />
    </div>,
    container
  );
}

document.body.style.margin = '10px';

render();
