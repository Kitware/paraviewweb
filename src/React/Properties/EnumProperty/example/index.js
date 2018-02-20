import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import EnumProperty from 'paraviewweb/src/React/Properties/EnumProperty';

const container = document.querySelector('.content');
let currVal = 1;
let currVal2 = 3;
let currVal3 = ['pasta', 'dessert'];

function render() {
  const properties = {
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
      label: 'Enum List',
      help: 'Choose one or multiple, if configured',
      domain: { one: 1, two: 2, three: 3, four: 4 },
      type: 'int',
    },
  };
  const properties2 = {
    data: { value: currVal2, id: 'enum.property.id2' },
    name: 'enum2',
    onChange: function onChange(data) {
      console.log(JSON.stringify(data));
      currVal2 = data.value[0];
      render();
    },
    show: () => true,
    ui: {
      domain: { 'one of course': 1, 'two probably': 2, three: 3, four: 4 },
      type: 'int',
      noEmpty: true,
    },
  };
  const properties3 = {
    data: { value: currVal3, id: 'enum.property.id3' },
    // help: 'Dynamic property list',
    name: 'enum',
    onChange: function onChange(data) {
      console.log(data.value);
      currVal3 = data.value;
      render();
    },
    show: () => true,
    ui: {
      label: 'Multi-select List',
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

  ReactDOM.render(
    <div style={{ maxWidth: '300px' }}>
      <EnumProperty {...properties} />
      <EnumProperty {...properties3} />
      <EnumProperty {...properties2} />
    </div>,
    container
  );
}

document.body.style.margin = '10px';

render();
