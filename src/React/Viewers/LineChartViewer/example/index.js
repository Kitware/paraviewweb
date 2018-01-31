import ChartViewer from '..';
import React from 'react';
import ReactDOM from 'react-dom';

// Load CSS
require('normalize.css');

// Get react component
const container = document.querySelector('.content'),
  data = { xRange: [-10, 123], fields: [] };

function createField(name, size, scale) {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push(
      Math.random() * scale * 0.1 + Math.sin(i / size * Math.PI * 4) * scale
    );
  }
  return { name, data };
}

data.fields.push(createField('Temperature', 500, 30));
data.fields.push(createField('Pressure', 500, 500));
data.fields.push(createField('Salinity', 500, 1));

container.style.width = '100%';
container.style.height = '100%';
container.style.position = 'absolute';
container.style.padding = '0';
// container.style.margin = '10px';
// container.style.border = 'solid 1px black';

ReactDOM.render(
  React.createElement(ChartViewer, { data, width: 500, height: 300 }),
  container
);
