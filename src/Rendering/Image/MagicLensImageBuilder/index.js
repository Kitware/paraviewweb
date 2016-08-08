import Monologue from 'monologue.js';
import now from 'mout/src/time/now';

import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

const
  IMAGE_READY_TOPIC = 'image-ready',
  MODEL_CHANGE_TOPIC = 'model-change';

// MagicLensImageBuilder Object ----------------------------------------------

export default class MagicLensImageBuilder {

  constructor(frontImageBuilder, backImageBuilder, lensColor = '#ff0000', minZoom = 20, maxZoom = 0.5, lineWidth = 2) {
    // Keep track of internal image builders
    this.frontImageBuilder = frontImageBuilder;
    this.backImageBuilder = backImageBuilder;
    this.frontEvent = null;
    this.backEvent = null;
    this.queryDataModel = this.frontImageBuilder.queryDataModel;

    // Internal render
    this.frontSubscription = this.frontImageBuilder.onImageReady((data, envelope) => {
      this.frontEvent = data;
      this.draw();
    });

    this.backSubscription = this.backImageBuilder.onImageReady((data, envelope) => {
      this.backEvent = data;
      this.draw();
    });

    // Lens informations
    const { dimensions } = frontImageBuilder.getControlModels();
    this.width = dimensions[0];
    this.height = dimensions[1];

    this.frontActive = true;

    this.minZoom = minZoom;
    this.maxZoom = Math.min(this.width, this.height) * maxZoom;
    this.lineWidth = lineWidth;

    this.lensColor = lensColor;
    this.lensCenterX = this.width / 2;
    this.lensCenterY = this.height / 2;
    this.lensOriginalCenterX = this.lensCenterX;
    this.lensOriginalCenterY = this.lensCenterY;
    this.lensDragDX = 0;
    this.lensDragDY = 0;
    this.lensRadius = Math.floor(Math.min(this.width, this.height) / 5);
    this.lensOriginalRadius = this.lensRadius;

    this.lastDragTime = now();
    this.lastZoomTime = now();
    this.newMouseTimeout = 250;

    this.lensDrag = false;
    this.listenerDrag = false;
    this.lensZoom = false;
    this.listenerZoom = false;

    // Rendering buffer
    this.bgCanvas = new CanvasOffscreenBuffer(this.width, this.height);

    // Create custom listener for lens drag + zoom
    this.listener = {
      drag: (event, envelope) => {
        var time = now(),
          newDrag = (this.lastDragTime + this.newMouseTimeout < time),
          eventManaged = false,
          activeArea = event.activeArea,
          xRatio = (event.relative.x - activeArea[0]) / activeArea[2],
          yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        // Clamp bounds
        xRatio = (xRatio < 0) ? 0 : (xRatio > 1) ? 1 : xRatio;
        yRatio = (yRatio < 0) ? 0 : (yRatio > 1) ? 1 : yRatio;

        const xPos = Math.floor(xRatio * this.width),
          yPos = Math.floor(yRatio * this.height),
          distFromLensCenter = Math.pow(xPos - this.lensCenterX, 2) + Math.pow(yPos - this.lensCenterY, 2);

        if (newDrag) {
          this.lensZoom = false;
          this.listenerZoom = false;
          this.lensDrag = false;
          this.listenerDrag = false;

          this.lensOriginalCenterX = this.lensCenterX;
          this.lensOriginalCenterY = this.lensCenterY;

          this.lensDragDX = xPos - this.lensCenterX;
          this.lensDragDY = yPos - this.lensCenterY;
        }

        if ((this.lensDrag || distFromLensCenter < Math.pow(this.lensRadius, 2)) && event.modifier === 0 && !this.listenerDrag) {
          eventManaged = true;
          this.lensDrag = true;

          this.lensCenterX = xPos - this.lensDragDX;
          this.lensCenterY = yPos - this.lensDragDY;

          // Make sure the lens can't go out of image
          this.lensCenterX = Math.max(this.lensCenterX, this.lensRadius);
          this.lensCenterY = Math.max(this.lensCenterY, this.lensRadius);
          this.lensCenterX = Math.min(this.lensCenterX, this.width - this.lensRadius);
          this.lensCenterY = Math.min(this.lensCenterY, this.height - this.lensRadius);

          this.draw();
        }

        // Handle mouse listener if any
        const ibListener = this.frontImageBuilder.getListeners();
        if (!eventManaged && ibListener && ibListener.drag) {
          this.listenerDrag = true;
          eventManaged = ibListener.drag(event, envelope);
        }

        // Update dragTime
        this.lastDragTime = time;

        return eventManaged;
      },
      /* eslint-disable complexity */
      zoom: (event, envelope) => {
        var time = now(),
          newZoom = (this.lastZoomTime + this.newMouseTimeout < time),
          eventManaged = false,
          activeArea = event.activeArea,
          xRatio = (event.relative.x - activeArea[0]) / activeArea[2],
          yRatio = (event.relative.y - activeArea[1]) / activeArea[3];

        // Reset  flags
        if (newZoom) {
          this.lensZoom = false;
          this.listenerZoom = false;
          this.lensDrag = false;
          this.listenerDrag = false;
        }

        // Clamp bounds
        xRatio = (xRatio < 0) ? 0 : (xRatio > 1) ? 1 : xRatio;
        yRatio = (yRatio < 0) ? 0 : (yRatio > 1) ? 1 : yRatio;

        const xPos = Math.floor(xRatio * this.width),
          yPos = Math.floor(yRatio * this.height),
          distFromLensCenter = Math.pow(xPos - this.lensCenterX, 2) + Math.pow(yPos - this.lensCenterY, 2);

        if ((this.lensZoom || distFromLensCenter < Math.pow(this.lensRadius, 2)) && event.modifier === 0 && !this.listenerZoom) {
          eventManaged = true;
          this.lensZoom = true;

          if (event.isFirst) {
            this.lensOriginalRadius = this.lensRadius;
          }
          let zoom = this.lensOriginalRadius * event.scale;

          if (zoom < this.minZoom) {
            zoom = this.minZoom;
          }
          if (zoom > this.maxZoom) {
            zoom = this.maxZoom;
          }

          if (this.lensRadius !== zoom) {
            this.lensRadius = zoom;
            this.draw();
          }

          if (event.isFinal) {
            this.lensOriginalRadius = this.lensRadius;
          }
        }

        // Handle mouse listener if any
        const ibListener = this.frontImageBuilder.getListeners();
        if (!eventManaged && ibListener && ibListener.zoom) {
          this.listenerZoom = true;
          eventManaged = ibListener.zoom(event, envelope);
        }

        // Update zoomTime
        this.lastZoomTime = time;

        return eventManaged;
      },
      /* eslint-enable complexity */
      click: (event, envelope) => {
        // Reset flags
        this.lensDrag = false;
        this.listenerDrag = false;
        this.lensZoom = false;
        this.listenerZoom = false;

        return false;
      },
    };
  }

  // ------------------------------------------------------------------------

  draw() {
    if (!this.frontEvent || !this.backEvent) {
      return;
    }

    // Draw
    const ctx = this.bgCanvas.get2DContext();
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw the outside
    ctx.drawImage(this.backEvent.canvas,
      this.backEvent.area[0], this.backEvent.area[1],
      this.backEvent.area[2], this.backEvent.area[3],
      0, 0, this.width, this.height);

    // Record state for undo clip
    ctx.save();

    // Create lens mask
    ctx.beginPath();
    ctx.arc(this.lensCenterX, this.lensCenterY, this.lensRadius, 0, 2 * Math.PI);
    ctx.clip();

    // Empty lens content
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw only in the lens
    ctx.drawImage(this.frontEvent.canvas,
      this.frontEvent.area[0], this.frontEvent.area[1],
      this.frontEvent.area[2], this.frontEvent.area[3],
      0, 0, this.width, this.height);

    // Restore clip
    ctx.restore();

    // Draw lens edge
    ctx.beginPath();
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lensColor;
    ctx.arc(this.lensCenterX, this.lensCenterY, this.lensRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    // Trigger image ready event
    const readyImage = {
      canvas: this.bgCanvas.el,
      area: [0, 0, this.width, this.height],
      outputSize: [this.width, this.height],
      builder: this,
      arguments: this.frontEvent.arguments,
    };

    // Let everyone know the image is ready
    this.emit(IMAGE_READY_TOPIC, readyImage);
  }

  // ------------------------------------------------------------------------

  update() {
    this.frontImageBuilder.update();
    this.backImageBuilder.update();
  }

  // ------------------------------------------------------------------------

  render() {
    this.frontImageBuilder.render();
    this.backImageBuilder.render();
  }

  // ------------------------------------------------------------------------

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  onModelChange(callback) {
    return this.on(MODEL_CHANGE_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  getListeners() {
    return this.listener;
  }

  // ------------------------------------------------------------------------

  destroy() {
    this.off();
    this.listener = null;

    this.frontSubscription.unsubscribe();
    this.frontSubscription = null;

    this.backSubscription.unsubscribe();
    this.backSubscription = null;

    this.frontImageBuilder.destroy();
    this.backImageBuilder.destroy();
  }

  // ------------------------------------------------------------------------

  getActiveImageBuilder() {
    return this.frontActive ? this.frontImageBuilder : this.backImageBuilder;
  }

  // ------------------------------------------------------------------------

  isFront() {
    return this.frontActive;
  }

  // ------------------------------------------------------------------------

  toggleLens() {
    this.frontActive = !this.frontActive;
    this.emit(MODEL_CHANGE_TOPIC);
  }

}

// Add Observer pattern using Monologue.js
Monologue.mixInto(MagicLensImageBuilder);
