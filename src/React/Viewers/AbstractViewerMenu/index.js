import React             from 'react';
import GeometryRenderer  from '../../Renderers/GeometryRenderer';
import ImageRenderer     from '../../Renderers/ImageRenderer';
import MultiViewRenderer from '../../Renderers/MultiLayoutRenderer';

import style             from 'PVWStyle/ReactViewers/AbstractViewerMenu.mcss';

export default React.createClass({

    displayName: 'AbstractViewerMenu',

    propTypes: {
        children: React.PropTypes.array,
        config: React.PropTypes.object,
        geometryBuilder: React.PropTypes.object,
        imageBuilder: React.PropTypes.object,
        layout: React.PropTypes.string,
        magicLensController: React.PropTypes.object,
        mouseListener: React.PropTypes.object,
        queryDataModel: React.PropTypes.object,
        renderer: React.PropTypes.string,
        renderers: React.PropTypes.object,
    },

    getDefaultProps() {
        return {
            config: {},
            renderer: 'ImageRenderer',
        };
    },

    getInitialState() {
        return {
            collapsed: true,
            speedIdx: 0,
            speeds: [ 20, 50, 100, 200, 500 ],
            record: false,
        };
    },

    // Auto mount listener unless notified otherwise
    componentWillMount() {
        this.attachListener(this.props.queryDataModel);
    },

    componentWillReceiveProps(nextProps) {
        var previousDataModel = this.props.queryDataModel,
            nextDataModel = nextProps.queryDataModel;

        if(previousDataModel !== nextDataModel) {
            this.detachListener();
            this.attachListener(nextDataModel);
        }
    },

    // Auto unmount listener
    componentWillUnmount() {
        this.detachListener();
    },

    attachListener(dataModel) {
        this.detachListener();
        this.queryDataModelChangeSubscription = dataModel.onStateChange((data, envelope) => {
            this.forceUpdate();
        });
    },

    detachListener() {
        if (this.queryDataModelChangeSubscription) {
            this.queryDataModelChangeSubscription.unsubscribe();
            this.queryDataModelChangeSubscription = null;
        }
    },

    toggleRecord() {
        var record = !this.state.record;
        this.setState({record});
        this.getRenderer().recordImages(record);
    },

    togglePanel() {
        this.setState({ collapsed: !this.state.collapsed });
        this.props.queryDataModel.fetchData();
    },

    toggleLens() {
        var magicLensController = this.props.magicLensController;
        if(magicLensController) {
            magicLensController.toggleLens();
            this.forceUpdate();
        }
    },

    resetCamera() {
        if(this.isMounted() && (this.props.renderer === 'ImageRenderer' || this.props.renderer === 'GeometryRenderer')) {
            this.refs.imageRenderer.resetCamera()
        }
    },

    play() {
        this.props.queryDataModel.animate(true, this.state.speeds[this.state.speedIdx]);
    },

    stop() {
        this.props.queryDataModel.animate(false);
    },

    updateSpeed() {
        var newIdx = (this.state.speedIdx + 1) % this.state.speeds.length,
            queryDataModel = this.props.queryDataModel;

        this.setState({ speedIdx: newIdx });
        if(queryDataModel.isAnimating()) {
            queryDataModel.animate(true, this.state.speeds[newIdx]);
        }
    },

    getRenderer() {
        return this.refs.imageRenderer;
    },

    /* eslint-disable complexity */
    render() {
        var queryDataModel = this.props.queryDataModel,
            magicLensController = this.props.magicLensController,
            rootImageBuilder = magicLensController || this.props.imageBuilder,
            renderer = null,
            serverRecording = !!this.props.config.Recording,
            isImageRenderer = (this.props.renderer === 'ImageRenderer'),
            isMultiViewer = (this.props.renderer === 'MultiViewRenderer'),
            isGeometryViewer = (this.props.renderer === 'GeometryRenderer');

        if(isImageRenderer) {
            renderer = (<ImageRenderer
                            ref='imageRenderer'
                            className={ style.renderer }
                            imageBuilder={ rootImageBuilder }
                            listener={ this.props.mouseListener || rootImageBuilder.getListeners() }
                        />);
        }

        if(isMultiViewer) {
            renderer = (<MultiViewRenderer
                            ref='imageRenderer'
                            className={ style.renderer }
                            renderers={this.props.renderers}
                            layout={this.props.layout}
                        />);
        }

        if(isGeometryViewer) {
            renderer = (<GeometryRenderer
                            ref='imageRenderer'
                            className={ style.renderer }
                            geometryBuilder={this.props.geometryBuilder}
                        />);
        }

        return (
            <div className={ style.container }>
                <div
                    className={ this.state.collapsed ? style.collapsedControl : style.control }>
                    <div className={ style.controlBar }>
                        <i  className={ magicLensController ?
                                            ( magicLensController.isFront() ? style.magicLensButtonIn : style.magicLensButtonOut)
                                            : style.hidden }
                            onClick={ this.toggleLens } >
                        </i>
                        <i  className={ (serverRecording && isImageRenderer && this.props.imageBuilder.handleRecord)
                                ? (this.state.record ? style.recordButtonOn : style.recordButtonOff) : style.hidden }
                            onClick={ this.toggleRecord }>
                        </i>
                        <i  className={ (isImageRenderer || isGeometryViewer) ? style.resetCameraButton : style.hidden }
                            onClick={ this.resetCamera }>
                        </i>
                        <i  className={ (queryDataModel.hasAnimationFlag() && !queryDataModel.isAnimating() ? style.playButton : style.hidden) }
                            onClick={ this.play }>
                        </i>
                        <i  className={ (queryDataModel.isAnimating() ? style.stopButton : style.hidden) }
                            onClick={ this.stop }>
                        </i>
                        <i  className={ (queryDataModel.hasAnimationFlag() ? style.speedButton : style.hidden) }
                            onClick={ this.updateSpeed }>
                        </i>
                        <i  className={ (queryDataModel.hasAnimationFlag() ? style.animationSpeed : style.hidden )}
                            onClick={ this.updateSpeed }>
                            { this.state.speeds[this.state.speedIdx] + 'ms'}
                        </i>
                        <i  className={ this.state.collapsed ? style.collapsedMenuButton : style.menuButton }
                            onClick={ this.togglePanel }>
                        </i>
                    </div>
                    <div className={ style.controlContent }>
                        { this.props.children }
                    </div>
                </div>
                { renderer }
            </div>
        );
    },
    /* eslint-enable complexity */
});
