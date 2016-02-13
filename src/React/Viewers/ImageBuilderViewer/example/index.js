import React                from 'react';
import ReactDOM             from 'react-dom';
import ImageBuilderViewer   from '..';
import QueryDataModel       from '../../../../IO/Core/QueryDataModel';
import ImageBuilder         from '../../../../Rendering/Image/QueryDataModelImageBuilder';
import jsonData             from 'tonic-arctic-sample-data/data/earth/index.json';

// Load CSS
require('normalize.css');

/* global __BASE_PATH__ */
const
    queryDataModel = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/earth/'),
    imageBuilder = new ImageBuilder(queryDataModel);

ReactDOM.render(
        React.createElement(
            ImageBuilderViewer, { queryDataModel, imageBuilder }),
            document.querySelector('.content')
        );

queryDataModel.fetchData()
