import DropDownWidget   from '..';
import React            from 'react';
import { render }       from 'react-dom';

document.body.style.padding = '10px';

function onChange(field) {
    console.log(field);
}

const container = document.querySelector('.content'),
    fields = ['Temperature', 'Pressure', 'Velocity'];

container.style.width = '100px';

render(
    React.createElement(
        DropDownWidget,
        {
            field: fields[1],
            fields,
            onChange,
        }),
    container);
