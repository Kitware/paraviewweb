import ImageBuilder         from '../../../../Rendering/Image/DataProberImageBuilder';
import jsonData             from 'tonic-arctic-sample-data/data/probe/index.json';
import LookupTableManager   from '../../../../Common/Core/LookupTableManager';
import Probe3DViewer        from '..';
import QueryDataModel       from '../../../../IO/Core/QueryDataModel';
import React                from 'react';
import ReactDOM             from 'react-dom';

// Load CSS
require('normalize.css');

const
    bodyElement = document.querySelector('.content');

// Fix dimension
jsonData.metadata.dimensions = [50,50,50];

/* global __BASE_PATH__ */
const dataModel = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/probe/');

ReactDOM.render(
    React.createElement(
        Probe3DViewer,
        {
            queryDataModel: dataModel,
            imageBuilder: new ImageBuilder(dataModel, new LookupTableManager()),
            probe: true,
        }),
    bodyElement);

setImmediate( () => {
    dataModel.fetchData();
});

