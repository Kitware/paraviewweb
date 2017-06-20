import React                from 'react';
import ReactDOM             from 'react-dom';
import jsonData             from 'tonic-arctic-sample-data/data/earth/index.json';

// Load CSS
import 'normalize.css';

import ImageBuilderViewer   from '..';
import QueryDataModel       from '../../../../IO/Core/QueryDataModel';
import ImageBuilder         from '../../../../Rendering/Image/QueryDataModelImageBuilder';

// Make sure the widget factory has the widget needed by this example
import '../../../CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const queryDataModel = new QueryDataModel(jsonData, `${__BASE_PATH__}/data/earth/`);
const imageBuilder = new ImageBuilder(queryDataModel);

ReactDOM.render(
        React.createElement(
            ImageBuilderViewer, { queryDataModel, imageBuilder }),
            document.querySelector('.content')
        );

queryDataModel.fetchData();
