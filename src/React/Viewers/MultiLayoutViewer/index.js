import React                from 'react';

import AbstractViewerMenu   from '../AbstractViewerMenu';
import MultiViewControl     from '../../CollapsibleControls/MultiViewControl';
import WidgetFactory        from '../../CollapsibleControls/CollapsibleControlFactory';

export default React.createClass({

  displayName: 'MultiLayoutViewer',

  propTypes: {
    layout: React.PropTypes.string,
    menuAddOn: React.PropTypes.array,
    queryDataModel: React.PropTypes.object.isRequired,
    renderers: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      activeRenderer: null,
      renderer: null,
    };
  },

  // FIXME need to do that properly if possible?
  /* eslint-disable react/no-did-mount-set-state */
  componentDidMount() {
    var renderer = this.catalystWidget.getRenderer();

    this.setState({ renderer });

    this.activeViewportSubscription = renderer.onActiveViewportChange((data, envelope) => {
      this.setState({
        activeRenderer: this.props.renderers[data.name],
      });
    });
  },
  /* eslint-enable react/no-did-mount-set-state */

  componentWillUpdate(nextProps, nextState) {
    var previousDataModel = (this.state.activeRenderer && this.state.activeRenderer.builder && this.state.activeRenderer.builder.queryDataModel)
      ? this.state.activeRenderer.builder.queryDataModel : this.props.queryDataModel,
      nextDataModel = (nextState.activeRenderer && nextState.activeRenderer.builder && nextState.activeRenderer.builder.queryDataModel)
      ? nextState.activeRenderer.builder.queryDataModel : nextProps.queryDataModel;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      this.attachListener(nextDataModel);
    }
  },

  // Auto unmount listener
  componentWillUnmount() {
    this.detachListener();
    if (this.activeViewportSubscription) {
      this.activeViewportSubscription.unsubscribe();
      this.activeViewportSubscription = null;
    }
  },

  attachListener(dataModel) {
    this.detachListener();
    if (dataModel) {
      this.queryDataModelChangeSubscription = dataModel.onStateChange((data, envelope) => {
        this.forceUpdate();
      });
    }
  },

  detachListener() {
    if (this.queryDataModelChangeSubscription) {
      this.queryDataModelChangeSubscription.unsubscribe();
      this.queryDataModelChangeSubscription = null;
    }
  },

  render() {
    var queryDataModel = (this.state.activeRenderer && this.state.activeRenderer.builder && this.state.activeRenderer.builder.queryDataModel)
      ? this.state.activeRenderer.builder.queryDataModel : this.props.queryDataModel,
      controlWidgets = [];

    if (this.state.activeRenderer) {
      controlWidgets = WidgetFactory.getWidgets(this.state.activeRenderer.builder || this.state.activeRenderer.painter);
    }

    // Add menuAddOn if any at the top
    if (this.props.menuAddOn) {
      controlWidgets = this.props.menuAddOn.concat(controlWidgets);
    }

    return (
      <AbstractViewerMenu
        ref={(c) => { this.catalystWidget = c; }}
        queryDataModel={queryDataModel}
        renderers={this.props.renderers}
        renderer="MultiViewRenderer"
        layout={this.props.layout}
      >
        <MultiViewControl renderer={this.state.renderer} />
        {controlWidgets}
      </AbstractViewerMenu>);
  },
});
