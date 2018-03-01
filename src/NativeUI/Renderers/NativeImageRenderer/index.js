/* global document Image */

import MouseHandler from 'paraviewweb/src/Interaction/Core/MouseHandler';

import SizeHelper from 'paraviewweb/src/Common/Misc/SizeHelper';

function formatSize(memorySize) {
  if (!memorySize) {
    return '';
  }
  if (memorySize > 1000000) {
    return `${Math.round(memorySize / 10000) / 100} MB - `;
  }
  if (memorySize > 1000) {
    return `${Math.round(memorySize / 10) / 100} KB - `;
  }
  return `${memorySize} B - `;
}

export default class NativeImageRenderer {
  constructor(
    domElement,
    imageProvider,
    mouseListeners = null,
    drawFPS = true
  ) {
    this.size = domElement
      ? SizeHelper.getSize(domElement)
      : { clientWidth: 400, clientHeight: 400 };
    this.canvas = document.createElement('canvas');
    this.image = new Image();
    this.fps = '';
    this.drawFPS = drawFPS;
    this.subscriptions = [];
    this.imageProvider = imageProvider;
    this.fpsBuffer = [];
    this.fpsBufferSize = 30;

    this.image.onload = () => {
      this.updateDrawnImage();
    };

    // Update DOM
    this.setContainer(domElement);

    this.ctx = this.canvas.getContext('2d');
    this.ctx.font = '30px Arial';

    // Attach mouse listener if needed
    if (mouseListeners) {
      this.mouseHandler = new MouseHandler(this.canvas);
      this.mouseHandler.attach(mouseListeners);
    }

    // Add image listener
    this.subscriptions.push(
      imageProvider.onImageReady((data, envelope) => {
        this.image.src = data.url;
        this.fps = data.fps;
        this.memsize = data.metadata.memory || '';
        this.workTime = data.metadata.workTime;
        this.fpsBuffer.push(this.fps);
        while (this.fpsBufferSize < this.fpsBuffer.length) {
          this.fpsBuffer.shift();
        }
      })
    );

    // Add size listener
    this.subscriptions.push(
      SizeHelper.onSizeChange(() => {
        if (this.container) {
          this.size = SizeHelper.getSize(this.container);
          this.canvas.setAttribute('width', this.size.clientWidth);
          this.canvas.setAttribute('height', this.size.clientHeight);
          if (this.image.src && this.image.complete) {
            this.updateDrawnImage();
          }
        }
      })
    );
    SizeHelper.startListening();
  }

  setDrawFPS(visible) {
    this.drawFPS = visible;
  }

  getStats() {
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    let total = 0;
    const size = this.fpsBuffer.length;
    for (let i = 0; i < size; i++) {
      const value = Number(this.fpsBuffer[i]);
      if (value < min) {
        min = value;
      }
      if (max < value) {
        max = value;
      }
      total += value;
    }
    total /= size;
    return `${Math.round(min)}<${Math.round(total)}<${Math.round(max)}`;
  }

  setContainer(container) {
    if (this.container) {
      this.container.removeChild(this.canvas);
    }
    this.container = container;
    if (this.container) {
      this.container.appendChild(this.canvas);
    }
  }

  resize() {
    if (this.container) {
      this.size = SizeHelper.getSize(this.container);
    }
  }

  setSize(clientWidth = 400, clientHeight = 400) {
    this.size = { clientWidth, clientHeight };
    this.canvas.setAttribute('width', this.size.clientWidth);
    this.canvas.setAttribute('height', this.size.clientHeight);
    if (this.image.src && this.image.complete) {
      this.updateDrawnImage();
    }
  }

  destroy() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }

    if (this.mouseHandler) {
      this.mouseHandler.destroy();
      this.mouseHandler = null;
    }

    this.container = null;
    this.imageProvider = null;
  }

  updateDrawnImage() {
    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.size.clientWidth,
      this.size.clientHeight
    );
    if (this.drawFPS) {
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'end';
      this.ctx.fillStyle = '#888';
      this.ctx.fillText(
        `${this.workTime}ms - ${formatSize(this.memsize)}${this.image.width}x${
          this.image.height
        } - ${this.fps} FPS - ${this.getStats()}`,
        this.size.clientWidth - 5,
        5
      );
    }
  }
}
