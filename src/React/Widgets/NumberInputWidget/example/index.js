import NumberInputWidget    from '..';
import React                from 'react';
import ReactDOM             from 'react-dom';

function onChange(value, name) {
    console.log(name, value);
}

ReactDOM.render(
    React.createElement(
        NumberInputWidget,
        {
          name: 'sample',
          min: '0',
          max: '100',
          step: '2',
          value: 50,
          onChange,
        } ),
    document.querySelector('.content'));
