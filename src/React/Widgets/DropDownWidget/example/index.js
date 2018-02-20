import 'normalize.css';

import React from 'react';
import { render } from 'react-dom';

import DropDownWidget from 'paraviewweb/src/React/Widgets/DropDownWidget';

document.body.style.padding = '10px';

function onChange(field) {
  console.log(field);
}

const container = document.querySelector('.content');
const fields = ['Temperature', 'Pressure', 'Velocity'];

container.style.width = '100px';

render(
  React.createElement(DropDownWidget, {
    field: fields[1],
    fields,
    onChange,
  }),
  container
);
