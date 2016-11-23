/* global document */
import React            from 'react';
import ReactDOM         from 'react-dom';
import TextInputWidget  from '..';

const container = document.querySelector('.content');
const textValue = 'Some text example...';

// Load CSS
require('normalize.css');
require('font-awesome/css/font-awesome.css');

document.body.style.padding = '10px';

function onChange(value, name) {
  render(name, value);
  console.log(name, ' => ', value);
}

function render(name, value) {
  ReactDOM.render(
    <div>
      <TextInputWidget name={name} value={value} onChange={onChange} />
      <TextInputWidget name={`${name}-search`} value={'search'} icon={'fa-search'} />
    </div>,
    container);
}

render('example', textValue);
