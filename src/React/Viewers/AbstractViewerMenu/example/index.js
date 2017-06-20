import AbstractViewerMenu   from '..';
import QueryDataModel       from '../../../../IO/Core/QueryDataModel';
import ImageBuilder         from '../../../../Rendering/Image/QueryDataModelImageBuilder';
import React                from 'react';
import ReactDOM             from 'react-dom';
import jsonData             from 'tonic-arctic-sample-data/data/earth/index.json';

// Load CSS
require('normalize.css');

/* global __BASE_PATH__ */
const
    bodyElement = document.querySelector('.content'),
    queryDataModel = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/earth/'),
    imageBuilder = new ImageBuilder(queryDataModel);

class FakeRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.resetCamera = this.resetCamera.bind(this);
  }

  resetCamera() {
    console.log('reset camera');
  }

  render() {
    return (<div />);
  }
}


ReactDOM.render(
    React.createElement(
        AbstractViewerMenu,
        {
            queryDataModel,
            imageBuilder,
            children: [
                (<p key='a'>This is the <em>AbstractViewerMenu</em>, takes a QueryDataModel and this content.</p>),
                (<p key='b'>You can put HTML or a React component here, a <em>QueryDataModelWidget</em> for example goes well here.</p>),
                (<button key='c' onClick={()=>alert('button pressed')}>Press me</button>),
            ],
            rendererClass: FakeRenderer,
        }),
    bodyElement);

queryDataModel.fetchData()
