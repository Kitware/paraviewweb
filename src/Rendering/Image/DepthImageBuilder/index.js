import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

export default class DepthImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(queryDataModel, dataName) {
    super({
      queryDataModel, dimensions: queryDataModel.getDataMetaData(dataName).dimensions,
    });

    this.dataName = dataName;
    this.depthArray = null;
    this.dimensions = queryDataModel.getDataMetaData(dataName).dimensions;

    this.bgCanvas = new CanvasOffscreenBuffer(this.dimensions[0], this.dimensions[1]);
    this.registerObjectToFree(this.bgCanvas);

    this.registerSubscription(queryDataModel.onDataChange((data, envelope) => {
      this.depthArray = new Uint8Array(data[this.dataName].data);
      this.render();
    }));
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.depthArray) {
      this.update();
      return;
    }

    const ctx = this.bgCanvas.get2DContext(),
      width = this.dimensions[0],
      height = this.dimensions[1],
      imageData = this.bgCanvas.el.getContext('2d').getImageData(0, 0, width, height),
      pixels = imageData.data,
      size = width * height;

    // Fill bgCanvas with depth
    for (let i = 0; i < size; i++) {
      const value = this.depthArray[i];
      pixels[(i * 4) + 0] = value;
      pixels[(i * 4) + 1] = value;
      pixels[(i * 4) + 2] = value;
      pixels[(i * 4) + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    const readyImage = {
      canvas: this.bgCanvas.el,
      area: [0, 0, width, height],
      outputSize: [width, height],
      builder: this,
    };

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.bgCanvas = null;
    this.dataName = null;
    this.depthArray = null;
    this.dimensions = null;
  }

}
