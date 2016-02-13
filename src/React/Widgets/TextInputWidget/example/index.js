import TextInputWidget  from '..';
import React            from 'react';
import ReactDOM         from 'react-dom';

const container = document.querySelector('.content'),
    textValue = 'Some text example...';

// Load CSS
require('normalize.css');

document.body.style.padding = '10px';

function onChange(value, name) {
    render(name, value);
    console.log(name, ' => ' , value);
}

function render(name, value) {
    ReactDOM.render(
        <TextInputWidget name={name} value={value} onChange={onChange}/>,
        container);
}

render('example', textValue);
