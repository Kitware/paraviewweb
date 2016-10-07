/* global XMLHttpRequest Image */

import CanvasOffscreenBuffer from '../CanvasOffscreenBuffer';

export default class ImageExporter {
  constructor(format = 'image/jpeg', padding = 3) {
    this.format = format;
    this.padding = padding;
    this.counter = 0;
    this.bgCanvas = null;
    this.imageToDecode = null;
  }

  exportImage(data) {
    var xhr = new XMLHttpRequest();
    var dataToSend = {};
    var ts = Number(this.counter).toString();
    this.counter += 1;

    if (!data.canvas || !data.arguments) {
      return;
    }

    while (ts.length < this.padding) {
      ts = `0${ts}`;
    }
    dataToSend.arguments = data.arguments;
    dataToSend.image = data.canvas.toDataURL(this.format);
    /* eslint-disable no-underscore-dangle */
    dataToSend.arguments.__ = ts;

    xhr.open('POST', '/export', true);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = (e) => {
      if (xhr.status === 200) {
        return;
      }
    };

    xhr.onerror = (e) => {
      console.log('error export', data.arguments);
    };

    xhr.send(JSON.stringify(dataToSend));
  }

  updateMetadata(dataToSend) {
    // Validate image data and use a canvas to convert it if need be
    if (dataToSend.image.indexOf('blob:') !== -1) {
      if (!this.bgCanvas) {
        this.bgCanvas = new CanvasOffscreenBuffer(100, 100);
      }
      if (!this.imageToDecode) {
        this.imageToDecode = new Image();
      }

      // Decode image
      this.imageToDecode.src = dataToSend.image;

      // Resize canvas and draw image into it
      this.bgCanvas.size(this.imageToDecode.width, this.imageToDecode.height);
      this.bgCanvas.get2DContext().drawImage(this.imageToDecode, 0, 0);
      dataToSend.image = this.bgCanvas.toDataURL('image/png');
    }

    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/update', true);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = (e) => {
      if (xhr.status === 200) {
        return;
      }
    };

    xhr.onerror = (e) => {
      console.log('error export', e);
    };

    xhr.send(JSON.stringify(dataToSend));
  }

  extractCanvasRegion(canvas, region, outputSize, format = 'image/png') {
    if (!this.bgCanvas) {
      this.bgCanvas = new CanvasOffscreenBuffer(100, 100);
    }

    this.bgCanvas.size(outputSize[0], outputSize[1]);
    this.bgCanvas.get2DContext().drawImage(canvas, region[0], region[1], region[2], region[3], 0, 0, outputSize[0], outputSize[1]);
    return this.bgCanvas.toDataURL(format);
  }
}
