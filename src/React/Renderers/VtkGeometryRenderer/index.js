/* global window */

import React                           from 'react';

import vtkOpenGLRenderWindow           from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkSynchronizableRenderWindow   from 'vtk.js/Sources/Rendering/Misc/SynchronizableRenderWindow';
import vtkRenderWindowInteractor       from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleManipulator   from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkTrackballPan                 from 'vtk.js/Sources/Interaction/Manipulators/TrackballPan';
import vtkTrackballZoom                from 'vtk.js/Sources/Interaction/Manipulators/TrackballZoom';
import vtkTrackballRotate              from 'vtk.js/Sources/Interaction/Manipulators/TrackballRotate';


const SYNCHRONIZATION_CONTEXT_NAME = 'pvwLocalRenderingContext';


export default class VtkGeometryRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.geometryTopicSubscription = null;
    this.renderWindow = null;

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
    // FIXME: clear only the specific time updater that we know and care about, the camera
    synchCtx.clearAllOneTimeUpdaters();

    const container = this.rootContainer;

    // VTK renderWindow/renderer
    const renderWindowInitialValues = {
      synchronizerContextName: this.props.synchronizerContextName,
    };

    if (this.state.viewId !== -1) {

    }

    this.renderWindow = vtkSynchronizableRenderWindow.newInstance(renderWindowInitialValues);

    // OpenGlRenderWindow
    const openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    openGlRenderWindow.setContainer(container);
    this.renderWindow.addView(openGlRenderWindow);

    const interactorStyle = vtkInteractorStyleManipulator.newInstance();

    const panManipulator = vtkTrackballPan.newInstance();
    panManipulator.setButton(1);
    panManipulator.setShift(false);
    panManipulator.setControl(true);
    interactorStyle.addManipulator(panManipulator);

    const zoomManipulator = vtkTrackballZoom.newInstance();
    zoomManipulator.setButton(1);
    zoomManipulator.setShift(true);
    zoomManipulator.setControl(false);
    interactorStyle.addManipulator(zoomManipulator);

    const rotateManipulator = vtkTrackballRotate.newInstance();
    rotateManipulator.setButton(1);
    rotateManipulator.setShift(false);
    rotateManipulator.setControl(false);
    interactorStyle.addManipulator(rotateManipulator);

    // Interactor
    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(openGlRenderWindow);
    interactor.setInteractorStyle(interactorStyle);
    interactor.initialize();
    interactor.bindEvents(container);

    function viewChanged(data) {
      const viewState = data[0];
      console.log('Received scene desciption:');
      console.log(viewState);
      if (viewState.extra && viewState.extra.centerOfRotation) {
        interactorStyle.setCenterOfRotation(viewState.extra.centerOfRotation);
      }
      this.renderWindow.synchronize(viewState);
    }

    // Subscribes to wamp pubsub topic
    this.props.client.VtkGeometryDelivery.onViewChange(viewChanged).then((subscription) => {
      console.log('Topic subscription succeeded');
      console.log(subscription);
      this.geometryTopicSubscription = subscription;
    }, (subError) => {
      console.log('Failed to subscribe to topic');
      console.log(subError);
    });

    // Lets the server know we are interested in changes to one of it's views
    this.props.client.VtkGeometryDelivery.addViewObserver(this.props.viewId).then((successResult) => {
      console.log(`Successfully added observer to view ${this.props.viewId}`);
      console.log(successResult);
      this.setState({ viewId: successResult.viewId });
    }, (failureResult) => {
      console.log(`Failed to add observer to view ${this.props.viewId}`);
      console.log(failureResult);
    });

    // Handle window resize
    function updateRenderWindowSize() {
      const dims = container.getBoundingClientRect();
      openGlRenderWindow.setSize(dims.width, dims.height);
      this.renderWindow.render();
    }

    if (this.props.resizeOnWindowResize) {
      window.addEventListener('resize', updateRenderWindowSize);
    }

    updateRenderWindowSize();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.viewId !== this.state.viewId) {
      // remove observer for old view
      // add observer for new view
      // dump the synchronizable render window and make a new one
    }
  }

  componentWillUnmount() {
    console.log('Unsubscribing from view change topic');
    this.props.client.VtkGeometryDelivery.offViewChange(this.geometryTopicSubscription)
      .then((unsubSuccess) => {
        console.log('Unsubscribe resolved ', unsubSuccess);
      }, (unsubFailure) => {
        console.log('Unsubscribe resolved ', unsubFailure);
      });

    // const actualViewId = this.rootContainer.getAttribute('data-view-id');
    const actualViewId = this.state.viewId;
    this.props.client.VtkGeometryDelivery.removeViewObserver(actualViewId).then((successResult) => {
      console.log(`Removed observer from view ${actualViewId} succeeded`);
      console.log(successResult);
    }, (failureResult) => {
      console.log(`Failed to remove observer from view ${actualViewId}`);
      console.log(failureResult);
    });

    // Get our hands on the default synchronization context and clean it up
    const synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext(this.props.synchronizerContextName);
    // FIXME: clear only the specific time updater that we know and care about, the camera
    // synchCtx.clearAllOneTimeUpdaters();

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
  viewId: '-1',
  interactionTimout: 500,
  synchronizerContextName: SYNCHRONIZATION_CONTEXT_NAME,
  resizeOnWindowResize: false,
  clearInstanceCacheOnUnMount: false,
  clearArrayCacheOnUnMount: false,
};
