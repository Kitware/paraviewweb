import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactViewers/AbstractViewerMenu.mcss';

export default class AbstractViewerMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: props.initialStateCollapsed,
      speedIdx: props.initialStateSpeedIdx,
      speeds: props.initialStateSpeeds,
      record: false,
    };

    // Bind methods
    this.toggleRecord = this.toggleRecord.bind(this);
    this.togglePanel = this.togglePanel.bind(this);
    this.toggleLens = this.toggleLens.bind(this);
    this.resetCamera = this.resetCamera.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
    this.updateSpeed = this.updateSpeed.bind(this);
  }

  // Auto mount listener unless notified otherwise
  componentWillMount() {
    this.attachListener(this.props.queryDataModel);
  }

  componentDidMount() {
    this.isReady = true;
  }

  componentWillReceiveProps(nextProps) {
    var previousDataModel = this.props.queryDataModel,
      nextDataModel = nextProps.queryDataModel;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      this.attachListener(nextDataModel);
    }
  }

  // Auto unmount listener
  componentWillUnmount() {
    this.isReady = false;
    this.detachListener();
  }

  getRenderer() {
    return this.renderer;
  }

  attachListener(dataModel) {
    this.detachListener();
    this.queryDataModelChangeSubscription = dataModel.onStateChange(
      (data, envelope) => {
        this.forceUpdate();
      }
    );
  }

  detachListener() {
    if (this.queryDataModelChangeSubscription) {
      this.queryDataModelChangeSubscription.unsubscribe();
      this.queryDataModelChangeSubscription = null;
    }
  }

  toggleRecord() {
    var record = !this.state.record;
    this.setState({ record });
    this.getRenderer().recordImages(record);
  }

  togglePanel() {
    this.setState({ collapsed: !this.state.collapsed });
    this.props.queryDataModel.fetchData();
  }

  toggleLens() {
    var magicLensController = this.props.magicLensController;
    if (magicLensController) {
      magicLensController.toggleLens();
      this.forceUpdate();
    }
  }

  resetCamera() {
    if (
      this.isReady &&
      (this.props.renderer === 'ImageRenderer' ||
        this.props.renderer === 'GeometryRenderer')
    ) {
      this.renderer.resetCamera();
    }
  }

  play() {
    this.props.queryDataModel.animate(
      true,
      this.state.speeds[this.state.speedIdx]
    );
  }

  stop() {
    this.props.queryDataModel.animate(false);
  }

  updateSpeed() {
    var newIdx = (this.state.speedIdx + 1) % this.state.speeds.length,
      queryDataModel = this.props.queryDataModel;

    this.setState({ speedIdx: newIdx });
    if (queryDataModel.isAnimating()) {
      queryDataModel.animate(true, this.state.speeds[newIdx]);
    }
  }

  /* eslint-disable complexity */
  render() {
    const Renderer = this.props.rendererClass;

    const queryDataModel = this.props.queryDataModel;
    const magicLensController = this.props.magicLensController;
    const rootImageBuilder = magicLensController || this.props.imageBuilder;
    const serverRecording = !!this.props.config.Recording;

    return (
      <div className={style.container}>
        <div
          className={
            this.state.collapsed ? style.collapsedControl : style.control
          }
        >
          <div className={style.controlBar}>
            <i
              className={
                magicLensController
                  ? magicLensController.isFront()
                    ? style.magicLensButtonIn
                    : style.magicLensButtonOut
                  : style.hidden
              }
              onClick={this.toggleLens}
            />
            <i
              className={
                serverRecording &&
                this.props.renderer === 'ImageRenderer' &&
                this.props.imageBuilder.handleRecord
                  ? this.state.record
                    ? style.recordButtonOn
                    : style.recordButtonOff
                  : style.hidden
              }
              onClick={this.toggleRecord}
            />
            <i
              className={
                ['ImageRenderer', 'GeometryRenderer'].indexOf(
                  this.props.renderer
                ) !== -1
                  ? style.resetCameraButton
                  : style.hidden
              }
              onClick={this.resetCamera}
            />
            <i
              className={
                queryDataModel.hasAnimationFlag() &&
                !queryDataModel.isAnimating()
                  ? style.playButton
                  : style.hidden
              }
              onClick={this.play}
            />
            <i
              className={
                queryDataModel.isAnimating() ? style.stopButton : style.hidden
              }
              onClick={this.stop}
            />
            <i
              className={
                queryDataModel.hasAnimationFlag()
                  ? style.speedButton
                  : style.hidden
              }
              onClick={this.updateSpeed}
            />
            <i
              className={
                queryDataModel.hasAnimationFlag()
                  ? style.animationSpeed
                  : style.hidden
              }
              onClick={this.updateSpeed}
            >
              {`${this.state.speeds[this.state.speedIdx]}ms`}
            </i>
            <i
              className={
                this.state.collapsed
                  ? style.collapsedMenuButton
                  : style.menuButton
              }
              onClick={this.togglePanel}
            />
          </div>
          <div className={style.controlContent}>{this.props.children}</div>
        </div>
        <Renderer
          // Common
          className={style.renderer}
          ref={(c) => {
            this.renderer = c;
          }}
          userData={this.props.userData}
          // ImageRenderer
          imageBuilder={rootImageBuilder}
          listener={
            this.props.mouseListener ||
            (rootImageBuilder && rootImageBuilder.getListeners
              ? rootImageBuilder.getListeners()
              : null)
          }
          // MultiViewRenderer
          renderers={this.props.renderers}
          layout={this.props.layout}
          // GeometryRenderer
          geometryBuilder={this.props.geometryBuilder}
          // PlotlyRenderer
          chartBuilder={this.props.chartBuilder}
        />
      </div>
    );
  }
  /* eslint-enable complexity */
}

AbstractViewerMenu.propTypes = {
  children: PropTypes.array,
  config: PropTypes.object,
  geometryBuilder: PropTypes.object,
  imageBuilder: PropTypes.object,
  chartBuilder: PropTypes.object,
  layout: PropTypes.string,
  magicLensController: PropTypes.object,
  mouseListener: PropTypes.object,
  queryDataModel: PropTypes.object,
  renderer: PropTypes.string,
  rendererClass: PropTypes.func,
  renderers: PropTypes.object,
  userData: PropTypes.object,
  initialStateCollapsed: PropTypes.bool,
  initialStateSpeedIdx: PropTypes.number,
  initialStateSpeeds: PropTypes.array,
};

AbstractViewerMenu.defaultProps = {
  config: {},
  renderer: 'ImageRenderer',
  initialStateCollapsed: true,
  initialStateSpeedIdx: 0,
  initialStateSpeeds: [20, 50, 100, 200, 500],
};
