/* global WebSocket Blob window URL */

import Monologue from 'monologue.js';

const
  IMAGE_READY = 'image.ready';

export default class BinaryImageStream {
  constructor(endpointURL, stillQuality = 100, interactiveQuality = 50, mimeType = 'image/jpeg') {
    this.endpoint = endpointURL;
    this.ws = null;
    this.textMode = true;
    this.metadata = null;
    this.activeURL = null;
    this.fps = 0;
    this.mimeType = mimeType;
    this.lastTime = +(new Date());
    this.view_id = -1;
    this.stillQuality = stillQuality;
    this.interactiveQuality = interactiveQuality;

    this.lastImageReadyEvent = null;
  }

  enableView(enabled) {
    this.ws.send(JSON.stringify({
      view_id: this.view_id,
      enabled,
    }));
  }

  startInteractiveQuality() {
    this.ws.send(JSON.stringify({
      view_id: this.view_id,
      quality: this.interactiveQuality,
    }));
  }

  stopInteractiveQuality() {
    this.ws.send(JSON.stringify({
      view_id: this.view_id,
      quality: this.stillQuality,
    }));
  }

  invalidateCache() {
    this.ws.send(JSON.stringify({
      view_id: this.view_id,
      invalidate_cache: true,
    }));
  }

  updateQuality(stillQuality = 100, interactiveQuality = 50) {
    this.stillQuality = stillQuality;
    this.interactiveQuality = interactiveQuality;
  }

  /* eslint-disable camelcase */
  connect({ view_id = -1, size = [500, 500] }) {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        this.ws = new WebSocket(this.endpoint);
        this.textMode = true;

        this.view_id = view_id;
        this.width = size[0];
        this.height = size[1];

        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({
            view_id,
          }));
          resolve();
        };

        this.ws.onmessage = (msg) => {
          if (this.textMode) {
            this.metadata = JSON.parse(msg.data);
          } else {
            const imgBlob = new Blob([msg.data], {
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
              metadata: this.metadata,
            };

            this.emit(IMAGE_READY, this.lastImageReadyEvent);
          }
          this.textMode = !this.textMode;
        };
      }
    });
  }
  /* eslint-enable camelcase */

  destroy() {
    this.off();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onImageReady(callback) {
    return this.on(IMAGE_READY, callback);
  }

  getLastImageReadyEvent() {
    return this.lastImageReadyEvent;
  }
}

Monologue.mixInto(BinaryImageStream);
