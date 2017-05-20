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
const ACTIVE_VIEW_ID = '-1';

export default class VtkGeometryRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.geometryTopicSubscription = null;

    // Set up initial state
    this.state = {
      viewId: props.viewId,
    };

    // Get our hands on the default synchronization context and tell how to fetch data arrays
    this.synchCtx = vtkSynchronizableRenderWindow.getSynchronizerContext(props.synchronizerContextName);
    this.synchCtx.setFetchArrayFunction(props.client.VtkGeometryDelivery.getArray);

    // VTK renderWindow/renderer
    const initialValues = { synchronizerContextName: props.synchronizerContextName };
    if (this.state.viewId !== ACTIVE_VIEW_ID) {
      initialValues.viewId = this.state.viewId;
    }

    this.renderWindow = vtkSynchronizableRenderWindow.newInstance(initialValues);

    // OpenGlRenderWindow
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance({ notifyImageReady: !!props.onImageReady });

    if (props.onImageReady) {
      this.imageReadySubscription = this.openGlRenderWindow.onImageReady(props.onImageReady);
    }
    this.renderWindow.addView(this.openGlRenderWindow);

    this.interactorStyle = vtkInteractorStyleManipulator.newInstance();

    const panManipulator = vtkTrackballPan.newInstance();
    panManipulator.setButton(1);
    panManipulator.setShift(false);
    panManipulator.setControl(true);
    this.interactorStyle.addManipulator(panManipulator);

    const zoomManipulator = vtkTrackballZoom.newInstance();
    zoomManipulator.setButton(1);
    zoomManipulator.setShift(true);
    zoomManipulator.setControl(false);
    this.interactorStyle.addManipulator(zoomManipulator);

    const rotateManipulator = vtkTrackballRotate.newInstance();
    rotateManipulator.setButton(1);
    rotateManipulator.setShift(false);
    rotateManipulator.setControl(false);
    this.interactorStyle.addManipulator(rotateManipulator);

    // Interactor
    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openGlRenderWindow);
    this.interactor.setInteractorStyle(this.interactorStyle);
    this.interactor.initialize();

    // Method binding
    this.viewChanged = this.viewChanged.bind(this);
    this.addViewObserver = this.addViewObserver.bind(this);
    this.removeViewObserver = this.removeViewObserver.bind(this);
    this.subscribeViewChangeTopic = this.subscribeViewChangeTopic.bind(this);
    this.unsubscribeViewChangeTopic = this.unsubscribeViewChangeTopic.bind(this);
    this.updateRenderWindowSize = this.updateRenderWindowSize.bind(this);
  }

  componentDidMount() {
    this.openGlRenderWindow.setContainer(this.rootContainer);
    this.interactor.bindEvents(this.rootContainer);

    // Subscribe to pubsub topic and add view observer
    this.subscribeViewChangeTopic();
    this.addViewObserver(this.state.viewId);

    if (this.props.resizeOnWindowResize) {
      window.addEventListener('resize', this.updateRenderWindowSize);
    }

    this.updateRenderWindowSize();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.viewId !== this.state.viewId && this.state.viewId !== '-1') {
      // Update observers for change in view id
      this.removeViewObserver(this.state.viewId);
      this.addViewObserver(nextProps.viewId);

      // dump the synchronizable render window and make a new one
      this.renderWindow.removeView(this.openGlRenderWindow);
      this.renderWindow.delete();
      const initialValues = { synchronizerContextName: this.props.synchronizerContextName };
      if (nextProps.viewId !== ACTIVE_VIEW_ID) {
        initialValues.viewId = nextProps.viewId;
      }
      this.renderWindow = vtkSynchronizableRenderWindow.newInstance(initialValues);
      this.renderWindow.addView(this.openGlRenderWindow);
    }

    if (nextProps.onImageReady !== this.props.onImageReady) {
      this.setNotifyImageReady(nextProps.onImageReady);
    }
  }

  componentWillUnmount() {
    this.interactor.unbindEvents(this.rootContainer);
    this.unsubscribeViewChangeTopic();
    this.removeViewObserver(this.state.viewId);
    window.removeEventListener('resize', this.updateRenderWindowSize);

    if (this.props.clearOneTimeUpdatersOnUnmount) {
      this.renderWindow.clearOneTimeUpdaters();
    }

    if (this.props.clearInstanceCacheOnUnmount) {
      this.synchCtx.emptyCachedInstances();
    }

    if (this.props.clearArrayCacheOnUnmount) {
      this.synchCtx.emptyCachedArrays();
    }
  }

  setNotifyImageReady(onImageReady) {
    if (this.openGlRenderWindow) {
      const notify = !!onImageReady;
      this.openGlRenderWindow.setNotifyImageReady(notify);
      if (notify) {
        this.imageReadySubscription = this.openGlRenderWindow.onImageReady(onImageReady);
        this.renderWindow.render();
      } else if (this.imageReadySubscription) {
        this.imageReadySubscription.unsubscribe();
      }
    }
  }

  getCameraParameters() {
    // FIXME: find the proper way to get the renderer we care about
    // Calling getCurrentRenderer() on the interactorStyle seems to return null
    // const activeCamera = this.interactorStyle.getCurrentRenderer().getActiveCamera();
    const activeCamera = this.activeCamera || this.renderWindow.getRenderers()[0].getActiveCamera();
    const cameraParams = activeCamera.get('position', 'focalPoint', 'viewUp');
    return Object.assign({}, cameraParams, { centerOfRotation: this.interactorStyle.getCenterOfRotation() });
  }

  setCameraParameters({ position, focalPoint, viewUp, centerOfRotation }) {
    const activeCamera = this.activeCamera || this.renderWindow.getRenderers()[0].getActiveCamera();
    activeCamera.set({ position, focalPoint, viewUp });
    this.interactorStyle.setCenterOfRotation(centerOfRotation);
    this.renderWindow.render();
  }

  getRenderWindow() {
    return this.renderWindow;
  }

  getManipulatorInteractorStyle() {
    return this.interactorStyle;
  }

  resetCamera() {
    this.renderWindow.getRenderers().forEach(renderer => renderer.resetCamera());
  }

  updateRenderWindowSize() {
    const dims = this.rootContainer.getBoundingClientRect();
    this.openGlRenderWindow.setSize(dims.width, dims.height);
    this.renderWindow.render();
  }

  unsubscribeViewChangeTopic() {
    this.props.client.VtkGeometryDelivery.offViewChange(this.geometryTopicSubscription)
      .then((unsubSuccess) => {
        // console.log('Unsubscribe resolved ', unsubSuccess);
      }, (unsubFailure) => {
        console.log('Unsubscribe resolved ', unsubFailure);
      });
  }

  subscribeViewChangeTopic() {
    this.props.client.VtkGeometryDelivery.onViewChange(this.viewChanged).then((subscription) => {
      this.geometryTopicSubscription = subscription;
    }, (subError) => {
      console.log('Failed to subscribe to topic');
      console.log(subError);
    });
  }

  removeViewObserver(viewId) {
    this.props.client.VtkGeometryDelivery.removeViewObserver(viewId).then((successResult) => {
      // console.log(`Removed observer from view ${viewId} succeeded`);
      // console.log(successResult);
    }, (failureResult) => {
      console.log(`Failed to remove observer from view ${viewId}`);
      console.log(failureResult);
    });
  }

  addViewObserver(viewId) {
    this.props.client.VtkGeometryDelivery.addViewObserver(viewId).then((successResult) => {
      // console.log(`Successfully added observer to view ${viewId}`);
      // console.log(successResult);
      this.props.viewIdUpdated(successResult.viewId);
      this.setState({ viewId: successResult.viewId });
    }, (failureResult) => {
      console.log(`Failed to add observer to view ${viewId}`);
      console.log(failureResult);
    });
  }

  viewChanged(data) {
    const viewState = data[0];
    if (this.renderWindow.synchronize(viewState) && viewState.extra) {
      if (viewState.extra.centerOfRotation) {
        this.interactorStyle.setCenterOfRotation(viewState.extra.centerOfRotation);
      }
      if (viewState.extra.camera) {
        this.activeCamera = this.synchCtx.getInstance(viewState.extra.camera);
      }
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
  viewId: React.PropTypes.string,
  interactionTimout: React.PropTypes.number,
  synchronizerContextName: React.PropTypes.string,
  resizeOnWindowResize: React.PropTypes.bool,
  clearOneTimeUpdatersOnUnmount: React.PropTypes.bool,
  clearInstanceCacheOnUnmount: React.PropTypes.bool,
  clearArrayCacheOnUnmount: React.PropTypes.bool,
  onImageReady: React.PropTypes.func,
  viewIdUpdated: React.PropTypes.func,
  client: React.PropTypes.object,
  connection: React.PropTypes.object,
};

VtkGeometryRenderer.defaultProps = {
  className: '',
  showFPS: false,
  style: {},
  viewId: ACTIVE_VIEW_ID,
  interactionTimout: 500,
  synchronizerContextName: SYNCHRONIZATION_CONTEXT_NAME,
  resizeOnWindowResize: false,
  clearOneTimeUpdatersOnUnmount: false,
  clearInstanceCacheOnUnmount: false,
  clearArrayCacheOnUnmount: false,
};
