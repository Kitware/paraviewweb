import LookupTableManager from '../../../../Common/Core/LookupTableManager';
import LookupTableWidget  from '..';
import React              from 'react';
import ReactDOM           from 'react-dom';

// Load CSS
require('normalize.css');

// Get react component
const
    lookupTableManager = new LookupTableManager(),
    lookupTable = lookupTableManager.addLookupTable('demo', [-5, 15], 'spectral');

document.body.style.padding = '10px';

const component = ReactDOM.render(
    React.createElement(
        LookupTableWidget,
        {
            lookupTable,
            originalRange: [-5, 15],
            inverse: true,
            lookupTableManager,
        }),
    document.querySelector('.content'));


setTimeout(function(){
    component.resetRange();
}, 500);
