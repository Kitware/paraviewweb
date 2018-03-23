import React from 'react';
import PropTypes from 'prop-types';

import BinaryImageStream from '../../../IO/WebSocket/BinaryImageStream';
import WslinkImageStream from '../../../IO/WebSocket/WslinkImageStream';
import NativeImageRenderer from '../../../NativeUI/Renderers/NativeImageRenderer';
import sizeHelper from '../../../Common/Misc/SizeHelper';
import VtkWebMouseListener from '../../../Interaction/Core/VtkWebMouseListener';

/* eslint-disable react/no-unused-prop-types */

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
      if (this.interacting === interact) {
        return;
      }
      this.interacting = interact;
      if (interact) {
        this.binaryImageStream.startInteractiveQuality();
      } else {
        this.binaryImageStream
          .stopInteractiveQuality()
          .then(this.binaryImageStream.invalidateCache);
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
      if (this.binaryImageStream.setViewSize) {
        this.binaryImageStream.setViewSize(clientWidth, clientHeight);
      } else {
        this.props.client.session.call('viewport.size.update', [
          parseInt(this.props.viewId, 10),
          clientWidth,
          clientHeight,
        ]);
      }
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
        sizeHelper.triggerChange();
        this.binaryImageStream.invalidateCache();
        this.pushSettingsToServer(this.props);
      });

    // Push settings at load time
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.pushSettingsToServer(nextProps);
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

  pushSettingsToServer(settings = {}) {
    if ('viewId' in settings && this.binaryImageStream) {
      const viewIdAsNumber = Number(settings.viewId);
      if (this.binaryImageStream.setViewId && viewIdAsNumber !== -1) {
        if (this.binaryImageStream.setViewId(viewIdAsNumber)) {
          this.binaryImageStream.invalidateCache();
          sizeHelper.triggerChange();
        }
      }
    }

    if (
      'stillQuality' in settings &&
      'interactiveQuality' in settings &&
      this.binaryImageStream &&
      this.binaryImageStream.updateQuality
    ) {
      this.binaryImageStream.updateQuality(
        settings.stillQuality,
        settings.interactiveQuality
      );
    }

    if (
      'stillRatio' in settings &&
      'interactiveRatio' in settings &&
      this.binaryImageStream &&
      this.binaryImageStream.updateResolutionRatio
    ) {
      this.binaryImageStream.updateResolutionRatio(
        settings.stillRatio,
        settings.interactiveRatio
      );
    }

    if (
      'maxFPS' in settings &&
      this.binaryImageStream &&
      this.binaryImageStream.setMaxFrameRate
    ) {
      this.binaryImageStream.setMaxFrameRate(settings.maxFPS);
    }

    if (
      'showFPS' in settings &&
      this.binaryImageStream &&
      this.imageRenderer.setDrawFPS
    ) {
      this.imageRenderer.setDrawFPS(settings.showFPS);
    }

    if (
      'throttleTime' in settings &&
      this.mouseListener &&
      this.mouseListener.setThrottleTime
    ) {
      this.mouseListener.setThrottleTime(settings.throttleTime);
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

  stillQuality: PropTypes.number,
  interactiveQuality: PropTypes.number,
  stillRatio: PropTypes.number,
  interactiveRatio: PropTypes.number,

  throttleTime: PropTypes.number,
  maxFPS: PropTypes.number,
};

VtkRenderer.defaultProps = {
  className: '',
  oldImageStream: false,
  showFPS: false,
  style: {},
  viewId: '-1',
  interactionTimout: 500,
  connection: null,

  stillQuality: 100,
  interactiveQuality: 50,
  stillRatio: 1,
  interactiveRatio: 0.5,

  throttleTime: 16.6,
  maxFPS: 30,
};
