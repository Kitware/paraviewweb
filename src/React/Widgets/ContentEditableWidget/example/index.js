import React                    from 'react';
import ReactDOM                 from 'react-dom';
import ContentEditableWidget    from '..';

// Load CSS
require('normalize.css');

const
    container = document.querySelector('.content'),
    html = 'initial value';

function onChange(name, action, user) {
    console.log(name, action, user);
}

ReactDOM.render(
    React.createElement(
        ContentEditableWidget,
        { html, onChange }),
    container);

document.body.style.margin = '10px';
