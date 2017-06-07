/* global WebSocket Blob window URL */

import Monologue from 'monologue.js';

const
  IMAGE_READY = 'image.ready';

export default class WslinkImageStream {
  constructor(client, stillQuality = 100, interactiveQuality = 50, mimeType = 'image/jpeg') {
    this.client = client;
    // this.ws = null;
    // this.textMode = true;
    this.metadata = null;
    this.activeURL = null;
    this.fps = 0;
    this.mimeType = mimeType;
    this.lastTime = +(new Date());
    this.view_id = -1;
    this.stillQuality = stillQuality;
    this.interactiveQuality = interactiveQuality;

    this.lastImageReadyEvent = null;

    this.viewChanged = this.viewChanged.bind(this);
  }

  // enableView(enabled) {
    // this.ws.send(JSON.stringify({
    //   view_id: this.view_id,
    //   enabled,
    // }));
  // }

  startInteractiveQuality() {
    this.client.VtkImageDelivery.viewQuality(this.view_id, this.interactiveQuality);
  }

  stopInteractiveQuality() {
    this.client.VtkImageDelivery.viewQuality(this.view_id, this.interactiveQuality);
  }

  invalidateCache() {
    this.client.VtkImageDelivery.invalidateCache(this.view_id);
  }

  updateQuality(stillQuality = 100, interactiveQuality = 50) {
    this.stillQuality = stillQuality;
    this.interactiveQuality = interactiveQuality;
  }

  unsubscribeRenderTopic() {
    this.client.VtkImageDelivery.offRenderChange(this.renderTopicSubscription)
      .then((unsubSuccess) => {
        console.log('Unsubscribe resolved ', unsubSuccess);
      }, (unsubFailure) => {
        console.log('Unsubscribe error ', unsubFailure);
      });
  }

  // subscribeRenderTopic() {
  //   this.client.VtkImageDelivery.onRenderChange(this.viewChanged).then((subscription) => {
  //     this.renderTopicSubscription = subscription;
  //   }, (subError) => {
  //     console.log('Failed to subscribe to topic');
  //     console.log(subError);
  //   });
  // }

  removeRenderObserver(viewId) {
    this.client.VtkImageDelivery.removeRenderObserver(viewId).then((successResult) => {
      console.log(`Removed observer from view ${viewId} succeeded`);
      console.log(successResult);
    }, (failureResult) => {
      console.log(`Failed to remove observer from view ${viewId}`);
      console.log(failureResult);
    });
  }

  // addRenderObserver(viewId) {
  //   this.client.VtkImageDelivery.addRenderObserver(viewId).then((successResult) => {
  //     console.log(`Successfully added observer to view ${viewId}`);
  //     console.log(successResult);
  //   }, (failureResult) => {
  //     console.log(`Failed to add observer to view ${viewId}`);
  //     console.log(failureResult);
  //   });
  // }

  viewChanged(data) {
    const msg = data[0];
    const imgBlob = new Blob([msg.image], {
      type: this.mimeType,
    });
    if (this.activeURL) {
      window.URL.revokeObjectURL(this.activeURL);
      this.activeURL = null;
    }
    this.activeURL = URL.createObjectURL(imgBlob);
    const time = +(new Date());
    this.fps = Math.floor(10000 / (time - this.lastTime)) / 10;
    this.lastTime = time;

    this.lastImageReadyEvent = {
      url: this.activeURL,
      fps: this.fps,
      metadata: { size: msg.size, id: msg.id },
    };

    this.emit(IMAGE_READY, this.lastImageReadyEvent);
  }

  /* eslint-disable camelcase */
  connect({ view_id = -1, size = [500, 500] }) {
    // Subscribe to pubsub topic and add view observer
    return new Promise((resolve, reject) => {
      this.view_id = view_id;
      this.width = size[0];
      this.height = size[1];

      this.client.VtkImageDelivery.onRenderChange(this.viewChanged).then((subscription) => {
        this.renderTopicSubscription = subscription;
        this.client.VtkImageDelivery.addRenderObserver(view_id).then((successResult) => {
          console.log(`Successfully added observer to view ${view_id}`);
          console.log(successResult);
          resolve(successResult);
        }, (failureResult) => {
          console.log(`Failed to add observer to view ${view_id}`);
          console.log(failureResult);
          reject(failureResult);
        });
      }, (subError) => {
        console.log('Failed to subscribe to topic');
        console.log(subError);
        reject(subError);
      });
    });
  }
  /* eslint-enable camelcase */

  destroy() {
    this.off();
    this.removeRenderObserver(this.view_id);
    this.unsubscribeRenderTopic();
    // if (this.ws) {
    //   this.ws.close();
    //   this.ws = null;
    // }
  }

  onImageReady(callback) {
    return this.on(IMAGE_READY, callback);
  }

  getLastImageReadyEvent() {
    return this.lastImageReadyEvent;
  }
}

Monologue.mixInto(WslinkImageStream);
