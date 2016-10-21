import React                from 'react';

import BinaryImageStream    from '../../../IO/WebSocket/BinaryImageStream';
import NativeImageRenderer  from '../../../NativeUI/Renderers/NativeImageRenderer';
import sizeHelper           from '../../../Common/Misc/SizeHelper';
import VtkWebMouseListener  from '../../../Interaction/Core/VtkWebMouseListener';

export default React.createClass({

  displayName: 'VtkRenderer',

  propTypes: {
    className: React.PropTypes.string,
    client: React.PropTypes.object,
    viewId: React.PropTypes.number,
    interactionTimout: React.PropTypes.number,
    connection: React.PropTypes.object,
    showFPS: React.PropTypes.bool,
    style: React.PropTypes.object,
  },

  getDefaultProps() {
    return {
      className: '',
      showFPS: false,
      style: {},
      viewId: -1,
      interactionTimout: 500,
    };
  },

  componentWillMount() {
    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
  },

  componentDidMount() {
    const container = this.rootContainer;

    const wsbUrl = `${this.props.connection.urls}b`;
    this.binaryImageStream = new BinaryImageStream(wsbUrl);
    this.mouseListener = new VtkWebMouseListener(this.props.client);

    // Attach interaction listener for image quality
    this.mouseListener.onInteraction((interact) => {
      if (interact) {
        this.binaryImageStream.startInteractiveQuality();
      } else {
        this.binaryImageStream.stopInteractiveQuality();
        setTimeout(() => this.binaryImageStream.invalidateCache(), this.props.interactionTimout);
      }
    });

    // Attach size listener
    this.subscription = sizeHelper.onSizeChange(() => {
      /* eslint-disable no-shadow */
      const { clientWidth, clientHeight } = sizeHelper.getSize(container);
      /* eslint-enable no-shadow */
      this.mouseListener.updateSize(clientWidth, clientHeight);
      this.props.client.session.call('viewport.size.update', [-1, clientWidth, clientHeight]);
    });

    // Create render
    this.imageRenderer = new NativeImageRenderer(container, this.binaryImageStream, this.mouseListener.getListeners(), this.props.showFPS);

    // Establish image stream connection
    this.binaryImageStream.connect({
      view_id: this.props.viewId,
    }).then(
      () => {
        // Update size and do a force push
        this.binaryImageStream.invalidateCache();
        sizeHelper.triggerChange();
      });
  },

  componentWillUnmount() {
    if (this.binaryImageStream) {
      this.binaryImageStream.destroy();
      this.binaryImageStream = null;
    }

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
  },

  render() {
    return <div className={this.props.className} style={this.props.style} ref={c => (this.rootContainer = c)} />;
  },
});

