import React from 'react';
import PropTypes from 'prop-types';

import AbstractViewerMenu from '../AbstractViewerMenu';
import MultiViewControl from '../../CollapsibleControls/MultiViewControl';
import WidgetFactory from '../../CollapsibleControls/CollapsibleControlFactory';
import MultiViewRenderer from '../../Renderers/MultiLayoutRenderer';

export default class MultiLayoutViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRenderer: null,
      renderer: null,
    };

    // Bind callback
    this.attachListener = this.attachListener.bind(this);
    this.detachListener = this.detachListener.bind(this);
  }

  // FIXME need to do that properly if possible?
  /* eslint-disable react/no-did-mount-set-state */
  componentDidMount() {
    const renderer = this.catalystWidget.getRenderer();

    this.setState({ renderer });

    this.activeViewportSubscription = renderer.onActiveViewportChange(
      (data, envelope) => {
        this.setState({
          activeRenderer: this.props.renderers[data.name],
        });
      }
    );
  }
  /* eslint-enable react/no-did-mount-set-state */

  componentWillUpdate(nextProps, nextState) {
    const previousDataModel =
      this.state.activeRenderer &&
      this.state.activeRenderer.builder &&
      this.state.activeRenderer.builder.queryDataModel
        ? this.state.activeRenderer.builder.queryDataModel
        : this.props.queryDataModel;
    const nextDataModel =
      nextState.activeRenderer &&
      nextState.activeRenderer.builder &&
      nextState.activeRenderer.builder.queryDataModel
        ? nextState.activeRenderer.builder.queryDataModel
        : nextProps.queryDataModel;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      this.attachListener(nextDataModel);
    }
  }

  // Auto unmount listener
  componentWillUnmount() {
    this.detachListener();
    if (this.activeViewportSubscription) {
      this.activeViewportSubscription.unsubscribe();
      this.activeViewportSubscription = null;
    }
  }

  attachListener(dataModel) {
    this.detachListener();
    if (dataModel) {
      this.queryDataModelChangeSubscription = dataModel.onStateChange(
        (data, envelope) => {
          this.forceUpdate();
        }
      );
    }
  }

  detachListener() {
    if (this.queryDataModelChangeSubscription) {
      this.queryDataModelChangeSubscription.unsubscribe();
      this.queryDataModelChangeSubscription = null;
    }
  }

  render() {
    const queryDataModel =
      this.state.activeRenderer &&
      this.state.activeRenderer.builder &&
      this.state.activeRenderer.builder.queryDataModel
        ? this.state.activeRenderer.builder.queryDataModel
        : this.props.queryDataModel;
    let controlWidgets = [];

    if (this.state.activeRenderer) {
      controlWidgets = WidgetFactory.getWidgets(
        this.state.activeRenderer.builder || this.state.activeRenderer.painter
      );
    }

    // Add menuAddOn if any at the top
    if (this.props.menuAddOn) {
      controlWidgets = this.props.menuAddOn.concat(controlWidgets);
    }

    return (
      <AbstractViewerMenu
        ref={(c) => {
          this.catalystWidget = c;
        }}
        queryDataModel={queryDataModel}
        renderers={this.props.renderers}
        renderer="MultiViewRenderer"
        rendererClass={MultiViewRenderer}
        layout={this.props.layout}
      >
        <MultiViewControl renderer={this.state.renderer} />
        {controlWidgets}
      </AbstractViewerMenu>
    );
  }
}

MultiLayoutViewer.propTypes = {
  layout: PropTypes.string,
  menuAddOn: PropTypes.array,
  queryDataModel: PropTypes.object.isRequired,
  renderers: PropTypes.object.isRequired,
  // userData: PropTypes.object,
};

MultiLayoutViewer.defaultProps = {
  layout: undefined,
  menuAddOn: undefined,
};
