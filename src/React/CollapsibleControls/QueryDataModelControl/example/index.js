import 'babel-polyfill';
import jsonData                 from '../../../Widgets/QueryDataModelWidget/example/info.js';
import QueryDataModel           from '../../../../IO/Core/QueryDataModel';
import QueryDataModelControl    from '..';
import React                    from 'react';
import ReactDOM                 from 'react-dom';

// Load CSS
require('normalize.css');

// Get react component
const dataModel = new QueryDataModel(jsonData, '/');

document.body.style.padding = '10px';

ReactDOM.render(
    React.createElement(
        QueryDataModelControl,
        { model: dataModel, handleExploration: true }),
    document.querySelector('.content'));
