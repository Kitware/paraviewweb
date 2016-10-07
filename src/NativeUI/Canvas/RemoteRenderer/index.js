/* global document Image */
/* eslint-disable no-underscore-dangle */

import Monologue            from 'monologue.js';
import MouseHandler         from '../../../Interaction/Core/MouseHandler';
import VtkWebMouseListener  from '../../../Interaction/Core/VtkWebMouseListener';
import SizeHelper           from '../../../Common/Misc/SizeHelper';

const IMAGE_READY_TOPIC = 'image-ready';

export default class RemoteRenderer {

  constructor(pvwClient, container = null, id = -1) {
    this.client = pvwClient;
    this.setQuality();
    this.stats = { deltaT: [] };
    this.lastError = null;
    this.quality = 100;
    this.renderPending = false;

    this.canvas = document.createElement('canvas');

    this.imageDecoder = new Image();
    this.imageDecoder.addEventListener('load', () => {
      // Render image to canvas
      this.canvas.setAttribute('width', this.imageDecoder.width);
      this.canvas.setAttribute('height', this.imageDecoder.height);
      const ctx = this.canvas.getContext('2d');
      ctx.drawImage(this.imageDecoder, 0, 0);
    });

    this.container = null;
    this.options = {
      view: id,
      size: [400, 400],
      mtime: 0,
      quality: 100,
      localTime: 0,
    };

    this.renderOnIdle = (force = false) => {
      if (this.__timeout === null) {
        this.__timeout = setTimeout(() => {
          if (!this.render(force)) {
            this.renderOnIdle(force);
          }
        }, 250);
      }
    };

    this.mouseListener = new VtkWebMouseListener(pvwClient);
    this.mouseListener.setInteractionDoneCallback((interact) => {
      this.quality = interact ? this.interactiveQuality : this.stillQuality;
      if (!this.render(!interact)) {
        this.renderOnIdle(!interact);
      }
    });

    this.setContainer(container);
  }

  setQuality(interactive = 50, still = 100) {
    this.stillQuality = still;
    this.interactiveQuality = interactive;
  }

  setView(id) {
    this.options.view = id;
  }

  setContainer(container = null) {
    if (this.container && this.container !== container) {
      // Clean previous container
      this.container.removeChild(this.canvas);
      this.mouseHandler.destroy();

      this.container = null;
      this.mouseHandler = null;
      this.size = null;
    }

    if (container && this.container !== container) {
      this.container = container;
      this.mouseHandler = new MouseHandler(container);
      this.mouseHandler.attach(this.mouseListener.getListeners());
      this.container.appendChild(this.canvas);
      this.size = SizeHelper.getSize(container);
      this.render(true);
    }
  }

  render(force = false) {
    // Skip rendering if we are not visible
    if (this.size && this.size.clientWidth === 0) {
      // pretend success rendering
      return true;
    }

    if (this.renderPending) {
      this.renderOnIdle(force);
      return false;
    }

    if (this.__timeout !== null) {
      // clear any renderOnIdle requests that are pending since we
      // are sending a render request.
      clearTimeout(this.__timeout);
      this.__timeout = null;
    }

    if (this.client && this.size && this.container) {
      this.renderPending = true;

      // Update local options
      this.options.size[0] = this.size.clientWidth;
      this.options.size[1] = this.size.clientHeight;
      this.options.quality = this.quality;
      this.options.localTime = +new Date();
      this.options.clearCache = !!force;
      if (force) {
        this.options.mtime = 0;
      }
      this.mouseListener.updateSize(this.options.size[0], this.options.size[1]);

      // Trigger remote call
      this.client.ViewPortImageDelivery.stillRender(this.options)
        .then(
          (resp) => {
            this.renderPending = false;

            // stats
            const localTime = +new Date();
            this.stats.workTime = resp.workTime;
            this.stats.roundTrip = (localTime - resp.localTime) - resp.workTime;
            this.stats.deltaT.push(localTime - resp.localTime);
            while (this.stats.deltaT.length > 100) {
              this.stats.deltaT.shift();
            }

            // update local options
            this.options.mtime = resp.mtime;
            this.view = resp.global_id;

            // process image
            if (resp.image) {
              this.imageDecoder.src = `data:image/${resp.format},${resp.image}`;
            }

            // final image
            if (resp.stale) {
              // No force render when we are stale otherwise
              // we will get in an infinite rendering loop
              this.renderOnIdle(false);
            } else {
              this.emit(IMAGE_READY_TOPIC, this);
            }
          },
          (err) => {
            this.renderPending = false;
            this.lastError = err;
          });
      return true;
    }
    return false;
  }

  resize() {
    if (this.container) {
      this.size = SizeHelper.getSize(this.container);
      this.render(true);
    }
  }

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }

  destroy() {
    this.off();
    this.setContainer(null);
    if (this.mouseListener) {
      this.mouseListener.destroy();
      this.mouseListener = null;
    }
    this.client = null;
    this.imageDecoder = null;
    this.canvas = null;
  }
}

Monologue.mixInto(RemoteRenderer);
