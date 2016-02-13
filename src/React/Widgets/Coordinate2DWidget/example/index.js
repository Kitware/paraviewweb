import Coordinate2DWidget   from '..';
import React                from 'react';
import ReactDOM             from 'react-dom';

const height = 100,
    width = 100;

ReactDOM.render(
    React.createElement(Coordinate2DWidget, { height, width, onChange: console.log, hideXY: true }),
    document.querySelector('.content'));
