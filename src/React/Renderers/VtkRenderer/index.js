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
    // Push settings at load time
    this.componentDidUpdate({ maxFPS: -1, client: null });
  }

  componentDidUpdate(prevProps) {
    const container = this.rootContainer;

    if (
      this.props.oldImageStream &&
      prevProps.oldImageStream !== this.props.oldImageStream
    ) {
      const wsbUrl = `${this.props.connection.urls}b`;
      if (this.binaryImageStream) {
        this.binaryImageStream.destroy();
      }
      this.binaryImageStream = new BinaryImageStream(wsbUrl);
    } else if (prevProps.client !== this.props.client) {
      if (this.binaryImageStream) {
        this.binaryImageStream.destroy();
      }
      this.binaryImageStream = WslinkImageStream.newInstance({
        client: this.props.client,
      });
    }
    if (prevProps.client !== this.props.client) {
      this.mouseListener = new VtkWebMouseListener(this.props.client);

      // Attach interaction listener for image qualitya
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
      this.subscription = sizeHelper.onSizeChangeForElement(container, () => {
        /* eslint-disable no-shadow */
        const { clientWidth, clientHeight } = sizeHelper.getSize(container);
        if (!this.mouseListener) {
          // already unmounted?
          return;
        }
        /* eslint-enable no-shadow */
        this.mouseListener.updateSize(clientWidth, clientHeight);
        if (this.binaryImageStream.setViewSize) {
          this.binaryImageStream.setViewSize(clientWidth, clientHeight);
          this.binaryImageStream.stillRender(clientWidth, clientHeight);
        } else {
          this.props.client.session.call('viewport.size.update', [
            // TODO: viewId change after component mounted isn't handled properly.
            parseInt(this.props.viewId, 10),
            clientWidth,
            clientHeight,
          ]);
        }
      });
      if (this.imageRenderer) {
        this.imageRenderer.destroy();
      }
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
        });
    }
    const viewIdAsNumber = Number(this.props.viewId);
    this.mouseListener.viewId = viewIdAsNumber;
    if (this.binaryImageStream.setViewId && viewIdAsNumber !== -1) {
      if (this.binaryImageStream.setViewId(viewIdAsNumber)) {
        this.binaryImageStream.invalidateCache();
        sizeHelper.triggerChange();
      }
    }
    if (this.binaryImageStream.updateQuality) {
      this.binaryImageStream.updateQuality(
        this.props.stillQuality,
        this.props.interactiveQuality
      );
    }
    if (this.binaryImageStream.updateResolutionRatio) {
      this.binaryImageStream.updateResolutionRatio(
        this.props.stillRatio,
        this.props.interactiveRatio
      );
    }

    if (
      this.binaryImageStream.setMaxFrameRate &&
      this.props.maxFPS !== prevProps.maxFPS
    ) {
      this.binaryImageStream.setMaxFrameRate(this.props.maxFPS);
    }

    if (this.imageRenderer.setDrawFPS) {
      this.imageRenderer.setDrawFPS(this.props.showFPS);
    }

    this.mouseListener.setThrottleTime(this.props.throttleTime);
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
