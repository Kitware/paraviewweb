import React from 'react';
import PropTypes from 'prop-types';

import BinaryImageStream from '../../../IO/WebSocket/BinaryImageStream';
import WslinkImageStream from '../../../IO/WebSocket/WslinkImageStream';
import NativeImageRenderer from '../../../NativeUI/Renderers/NativeImageRenderer';
import sizeHelper from '../../../Common/Misc/SizeHelper';
import VtkWebMouseListener from '../../../Interaction/Core/VtkWebMouseListener';

export default class VtkRenderer extends React.Component {
  componentWillMount() {
    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
  }

  componentDidMount() {
    const container = this.rootContainer;

    if (this.props.oldImageStream) {
      const wsbUrl = `${this.props.connection.urls}b`;
      this.binaryImageStream = new BinaryImageStream(wsbUrl);
    } else {
      this.binaryImageStream = WslinkImageStream.newInstance({
        client: this.props.client,
      });
    }
    this.mouseListener = new VtkWebMouseListener(this.props.client);

    // Attach interaction listener for image quality
    this.mouseListener.onInteraction((interact) => {
      if (interact) {
        this.binaryImageStream.startInteractiveQuality();
      } else {
        this.binaryImageStream.stopInteractiveQuality();
        setTimeout(
          this.binaryImageStream.invalidateCache,
          this.props.interactionTimout
        );
      }
    });

    // Attach size listener
    this.subscription = sizeHelper.onSizeChange(() => {
      /* eslint-disable no-shadow */
      const { clientWidth, clientHeight } = sizeHelper.getSize(container);
      /* eslint-enable no-shadow */
      this.mouseListener.updateSize(clientWidth, clientHeight);
      this.props.client.session.call('viewport.size.update', [
        parseInt(this.props.viewId, 10),
        clientWidth,
        clientHeight,
      ]);
    });

    // Create render
    this.imageRenderer = new NativeImageRenderer(
      container,
      this.binaryImageStream,
      this.mouseListener.getListeners(),
      this.props.showFPS
    );

    // Establish image stream connection
    this.binaryImageStream
      .connect({
        view_id: parseInt(this.props.viewId, 10),
      })
      .then(() => {
        // Update size and do a force push
        this.binaryImageStream.invalidateCache();
        sizeHelper.triggerChange();
      });
  }

  componentWillReceiveProps(nextProps) {
    const viewIdAsNumber = Number(nextProps.viewId);
    if (this.binaryImageStream.setViewId && viewIdAsNumber !== -1) {
      if (this.binaryImageStream.setViewId(viewIdAsNumber)) {
        this.binaryImageStream.invalidateCache();
        sizeHelper.triggerChange();
      }
    }
  }

  componentWillUnmount() {
    if (this.mouseListener) {
      this.mouseListener.destroy();
      this.mouseListener = null;
    }

    if (this.imageRenderer) {
      this.imageRenderer.destroy();
      this.imageRenderer = null;
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.binaryImageStream) {
      this.binaryImageStream.destroy();
      this.binaryImageStream = null;
    }
  }

  render() {
    return (
      <div
        className={this.props.className}
        style={this.props.style}
        ref={(c) => {
          this.rootContainer = c;
        }}
      />
    );
  }
}

VtkRenderer.propTypes = {
  className: PropTypes.string,
  client: PropTypes.object.isRequired,
  viewId: PropTypes.string,
  interactionTimout: PropTypes.number,
  oldImageStream: PropTypes.bool,
  showFPS: PropTypes.bool,
  style: PropTypes.object,
  connection: PropTypes.object,
};

VtkRenderer.defaultProps = {
  className: '',
  oldImageStream: false,
  showFPS: false,
  style: {},
  viewId: '-1',
  interactionTimout: 500,
  connection: null,
};
