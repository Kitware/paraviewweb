import React from 'react';
import PropTypes from 'prop-types';

import AbstractViewerMenu from '../AbstractViewerMenu';
import WidgetFactory from '../../CollapsibleControls/CollapsibleControlFactory';
import ImageRenderer from '../../Renderers/ImageRenderer';

export default class ImageBuilderViewer extends React.Component {
  componentWillMount() {
    this.attachListener(this.props.imageBuilder);
  }

  componentWillReceiveProps(nextProps) {
    const previousDataModel = this.props.imageBuilder;
    const nextDataModel = nextProps.imageBuilder;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      if (this.props.config.MagicLens) {
        this.attachListener(nextDataModel);
      }
    }
  }

  componentWillUnmount() {
    this.detachListener();
  }

  attachListener(dataModel) {
    this.detachListener();
    if (dataModel && dataModel.onModelChange) {
      this.changeSubscription = dataModel.onModelChange((data, envelope) => {
        this.forceUpdate();
      });
    }
  }

  detachListener() {
    if (this.changeSubscription) {
      this.changeSubscription.unsubscribe();
      this.changeSubscription = null;
    }
  }

  render() {
    const queryDataModel = this.props.queryDataModel;
    const magicLensController = this.props.config.MagicLens
      ? this.props.imageBuilder
      : null;
    const imageBuilder = this.props.config.MagicLens
      ? this.props.imageBuilder.getActiveImageBuilder()
      : this.props.imageBuilder;
    let controlWidgets = WidgetFactory.getWidgets(imageBuilder);

    // Add menuAddOn if any at the top
    if (this.props.menuAddOn) {
      controlWidgets = this.props.menuAddOn.concat(controlWidgets);
    }

    return (
      <AbstractViewerMenu
        {...this.props}
        queryDataModel={queryDataModel}
        magicLensController={magicLensController}
        imageBuilder={imageBuilder}
        userData={this.props.userData}
        config={this.props.config || {}}
        rendererClass={ImageRenderer}
      >
        {controlWidgets}
      </AbstractViewerMenu>
    );
  }
}

ImageBuilderViewer.propTypes = {
  config: PropTypes.object,
  imageBuilder: PropTypes.object.isRequired,
  menuAddOn: PropTypes.array,
  queryDataModel: PropTypes.object.isRequired,
  userData: PropTypes.object,
};

ImageBuilderViewer.defaultProps = {
  config: {},
  userData: {},
  menuAddOn: undefined,
};
