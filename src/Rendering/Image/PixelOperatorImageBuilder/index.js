import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

export default class PixelOperatorImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(operation = 'a-b', dependency = ['a', 'b']) {
    super({});

    this.data = {};
    this.listeners = {};
    this.dataSize = [200, 200];
    this.operation = operation;
    this.dependency = dependency;
    this.bgCanvas = new CanvasOffscreenBuffer(this.dataSize[0], this.dataSize[1]);

    this.registerObjectToFree(this.bgCanvas);
  }

  // ------------------------------------------------------------------------

  setOperation(expression) {
    this.operation = expression;
    this.processData();
  }

  // ------------------------------------------------------------------------

  setDependencies(dependencyList) {
    this.dependency = dependencyList;
  }

  // ------------------------------------------------------------------------

  getOperation() {
    return this.operation;
  }

  // ------------------------------------------------------------------------

  /* eslint-disable no-new-func */
  updateOperationFunction() {
    var isValid = true;
    const functionBody = [];

    Object.keys(this.data).forEach((key) => {
      functionBody.push('var X = data.X[i];'.replace(/X/g, key));
    });
    this.dependency.forEach((dep) => {
      isValid = this.data[dep] && isValid;
    });

    functionBody.push('return X;'.replace(/X/g, this.operation));
    this.fnOperation = new Function('data', 'i', functionBody.join(''));

    return isValid;
  }
  /* eslint-enable no-new-func */

  // ------------------------------------------------------------------------

  updateData(name, imageReadyEvent) {
    // Extract image data
    var area = imageReadyEvent.area,
      srcCanvas = imageReadyEvent.canvas,
      x = area[0],
      y = area[1],
      width = area[2],
      height = area[3],
      ctx = this.bgCanvas.get2DContext(),
      extractedData = new Uint8ClampedArray(width * height * 4),
      pixelBuffer = null;

    this.bgCanvas.size(width, height);
    ctx.drawImage(srcCanvas, x, y, width, height, 0, 0, width, height);
    pixelBuffer = ctx.getImageData(0, 0, width, height);
    extractedData.set(pixelBuffer.data);

    // Store the given array
    this.data[name] = extractedData;
    this.dataSize = [width, height];

    // Is dependency meet?
    let canProcess = true;
    this.dependency.forEach((depName) => {
      if (!this.data[depName]) {
        canProcess = false;
      }
    });

    if (canProcess) {
      this.processData();
    }
  }

  // ------------------------------------------------------------------------

  updateDataFromImage(name, image) {
    var registerImage = () => {
      // Remove callback if any
      image.removeEventListener('load', registerImage);

      // Extract image data
      const width = image.width,
        height = image.height,
        ctx = this.bgCanvas.get2DContext(),
        extractedData = new Uint8ClampedArray(width * height * 4);

      this.bgCanvas.size(width, height);
      ctx.drawImage(image, 0, 0);
      const pixelBuffer = ctx.getImageData(0, 0, width, height);
      extractedData.set(pixelBuffer.data);

      // Store the given array
      this.data[name] = extractedData;
      this.dataSize = [width, height];

      // Is dependency meet?
      let canProcess = true;
      this.dependency.forEach((depName) => {
        if (!this.data[depName]) {
          canProcess = false;
        }
      });

      if (canProcess) {
        this.processData();
      }
    };

    if (image.complete) {
      registerImage();
    } else {
      image.addEventListener('load', registerImage);
    }
  }

  // ------------------------------------------------------------------------

  updateDataFromClampedArray(name, array, size) {
    // Store the given array
    this.data[name] = array;
    this.dataSize = size || this.dataSize;

    // Is dependency meet?
    let canProcess = true;
    this.dependency.forEach((depName) => {
      if (!this.data[depName]) {
        canProcess = false;
      }
    });

    if (canProcess) {
      this.processData();
    }
  }

  // ------------------------------------------------------------------------

  processData() {
    if (!this.updateOperationFunction()) {
      // We are not ready yet
      return;
    }

    // Validate Array sizes
    let size = -1;
    let sizeValid = true;

    Object.keys(this.data).forEach((key) => {
      const array = this.data[key];
      if (size === -1) {
        size = array.length;
      } else {
        sizeValid = sizeValid && (size === array.length);
      }
    });

    if (!sizeValid || size === -1) {
      console.log('The array size are invalid!!!', size);
      return;
    }

    if (this.dataSize[0] * this.dataSize[1] * 4 !== size) {
      console.log('The array size are invalid!!!', size, this.dataSize);
      return;
    }

    // Evaluate pixel operation
    const resultArray = new Uint8ClampedArray(size);
    let idx = 0;
    while (idx < size) {
      resultArray[idx] = this.fnOperation(this.data, idx);
      resultArray[idx + 1] = this.fnOperation(this.data, idx + 1);
      resultArray[idx + 2] = this.fnOperation(this.data, idx + 2);
      resultArray[idx + 3] = 255;

      idx += 4;
    }

    // Push data in canvas
    this.bgCanvas.size(this.dataSize[0], this.dataSize[1]);
    const ctx = this.bgCanvas.get2DContext(),
      pixelBuffer = ctx.getImageData(0, 0, this.dataSize[0], this.dataSize[1]);

    pixelBuffer.data.set(resultArray);
    ctx.putImageData(pixelBuffer, 0, 0);

    const readyImage = {
      canvas: this.bgCanvas.el,
      area: [0, 0].concat(this.dataSize),
      outputSize: this.dataSize,
      builder: this,
    };

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  getListeners() {
    return this.listeners;
  }

  // ------------------------------------------------------------------------

  setListeners(l) {
    this.listeners = l;
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.bgCanvas = null;
    this.data = null;
    this.dataSize = null;
    this.dependency = null;
    this.listeners = null;
    this.operation = null;
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    return [{
      name: 'PixelOperatorControl',
      model: this,
    }];
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      dimensions: this.dataSize,
    };
  }

}
