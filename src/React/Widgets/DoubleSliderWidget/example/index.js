import 'babel-polyfill';
import DoubleSliderWidget   from '..';
import React                from 'react';
import ReactDOM             from 'react-dom';

function onChange(name, value) {
    console.log(name, value);
}

ReactDOM.render(
    React.createElement(
        DoubleSliderWidget,
        {
          name: 'sample',
          min: '0',
          max: '100',
          value: 50,
          onChange,
        } ),
    document.querySelector('.content'));
