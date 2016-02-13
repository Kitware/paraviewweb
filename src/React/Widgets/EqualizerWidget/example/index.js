import EqualizerWidget  from '..';
import React            from 'react';
import { render }       from 'react-dom';

document.body.style.margin = 0;
document.body.style.padding = 0;
document.querySelector('.content').style.height = '98vh';

function onChange(opacityList) {
    console.log(opacityList);
}

render(
    React.createElement(
        EqualizerWidget,
        {
            layers: [
                0, 0.1, 0.2, 1.0, 0.8, 0.4, 0.1, 0.2, 1.0, 0.8,
                0.4, 0.1, 0.2, 1.0, 0.8, 0.4, 0.1, 0.2, 1.0, 0.8],
            onChange,
            height: 512,
        }),
    document.querySelector('.content'));
