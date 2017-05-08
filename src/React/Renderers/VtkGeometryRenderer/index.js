/* global window */

import React                           from 'react';

import vtkOpenGLRenderWindow           from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkSynchronizableRenderWindow   from 'vtk.js/Sources/Rendering/Misc/SynchronizableRenderWindow';
import vtkRenderWindowInteractor       from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';


const SYNCHRONIZATION_CONTEXT_NAME = 'pvwLocalRenderingContext';


export default class VtkGeometryRenderer extends React.Component {
  constructor(props) {
    super(props);

    // Set up initial state
    this.state = {
      viewId: props.viewId,
    };
  }

  componentDidMount() {
    console.log('VtkGeometryRenderer is now mounted');

    // Get our hands on the default synchronization context and tell how to fetch data arrays
    const synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext(this.props.synchronizerContextName);
    synchCtx.setFetchArrayFunction(this.props.client.VtkGeometryDelivery.getArray);

    const container = this.rootContainer;

    // VTK renderWindow/renderer
    const renderWindow = vtkSynchronizableRenderWindow.newInstance({ synchronizerContextName: this.props.synchronizerContextName });

    // OpenGlRenderWindow
    const openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    openGlRenderWindow.setContainer(container);
    renderWindow.addView(openGlRenderWindow);

    // Interactor
    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(openGlRenderWindow);
    interactor.initialize();
    interactor.bindEvents(container);

    this.props.client.VtkGeometryDelivery.onViewChange((data) => {
      console.log('Received scene desciption:');
      console.log(data);
      renderWindow.synchronize(data[0]);
    });

    this.props.client.VtkGeometryDelivery.addViewObserver(this.props.viewId).then((successResult) => {
      console.log(`Subscribe to view ${this.props.viewId} succeeded`);
      console.log(successResult);
      this.setState({ viewId: successResult.viewId });
    }, (failureResult) => {
      console.log(`Failed to subscribe to view ${this.props.viewId}`);
      console.log(failureResult);
    });

    // Handle window resize
    function updateRenderWindowSize() {
      const dims = container.getBoundingClientRect();
      openGlRenderWindow.setSize(dims.width, dims.height);
      renderWindow.render();
    }

    if (this.props.resizeOnWindowResize) {
      window.addEventListener('resize', updateRenderWindowSize);
    }

    updateRenderWindowSize();
  }

  componentWillUnmount() {
    const actualViewId = this.rootContainer.getAttribute('data-view-id');
    this.props.client.VtkGeometryDelivery.removeViewObserver(actualViewId).then((successResult) => {
      console.log(`Unsubscribe from view ${actualViewId} succeeded`);
      console.log(successResult);
    }, (failureResult) => {
      console.log(`Failed to unsubscribe from view ${actualViewId}`);
      console.log(failureResult);
    });

    // Get our hands on the default synchronization context and clean it up
    const synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext(this.props.synchronizerContextName);

    if (this.props.clearInstanceCacheOnUnMount) {
      synchCtx.emptyCachedInstances();
    }

    if (this.props.clearArrayCacheOnUnMount) {
      synchCtx.emptyCachedArrays();
    }
  }

  render() {
    return <div className={this.props.className} data-view-id={this.state.viewId} style={this.props.style} ref={c => (this.rootContainer = c)} />;
  }
}

VtkGeometryRenderer.propTypes = {
  className: React.PropTypes.string,
  showFPS: React.PropTypes.bool,
  style: React.PropTypes.object,
  viewId: React.PropTypes.number,
  interactionTimout: React.PropTypes.number,
  synchronizerContextName: React.PropTypes.string,
  resizeOnWindowResize: React.PropTypes.bool,
  clearInstanceCacheOnUnMount: React.PropTypes.bool,
  clearArrayCacheOnUnMount: React.PropTypes.bool,
  client: React.PropTypes.object,
  connection: React.PropTypes.object,
};

VtkGeometryRenderer.defaultProps = {
  className: '',
  showFPS: false,
  style: {},
  viewId: -1,
  interactionTimout: 500,
  synchronizerContextName: SYNCHRONIZATION_CONTEXT_NAME,
  resizeOnWindowResize: true,
  clearInstanceCacheOnUnMount: true,
  clearArrayCacheOnUnMount: true,
};
