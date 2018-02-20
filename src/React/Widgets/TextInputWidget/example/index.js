import 'normalize.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import ReactDOM from 'react-dom';

import TextInputWidget from 'paraviewweb/src/React/Widgets/TextInputWidget';

const container = document.querySelector('.content');
const textValue = 'Some text example...';

document.body.style.padding = '10px';

function onChange(value, name) {
  render(name, value); // eslint-disable-line
  console.log(name, ' => ', value);
}

function render(name, value) {
  ReactDOM.render(
    <div>
      <TextInputWidget name={name} value={value} onChange={onChange} />
      <TextInputWidget
        name={`${name}-search`}
        value="search"
        icon="fa-search"
      />
    </div>,
    container
  );
}

render('example', textValue);
