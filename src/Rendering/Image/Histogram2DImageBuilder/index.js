import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

function affine(inMin, val, inMax, outMin, outMax) {
  return ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export default class Histogram2DImageBuilder extends AbstractImageBuilder {
  // ------------------------------------------------------------------------

  constructor(queryDataModel) {
    super({ queryDataModel });

    this.bgCanvas = new CanvasOffscreenBuffer(32, 32);
    this.registerObjectToFree(this.bgCanvas);

    if (queryDataModel) {
      this.registerSubscription(
        queryDataModel.onDataChange((data, envelope) => {
          this.histogram = data.histogram2D.data;
          this.render();
        })
      );
    }
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.bgCanvas = null;
  }

  // ------------------------------------------------------------------------

  setHistogram2D(data) {
    this.histogram = data;
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.histogram) {
      this.queryDataModel.fetchData();
      return;
    }

    const width = this.histogram.numberOfBins;
    const height = this.histogram.numberOfBins;
    this.bgCanvas.size(width, height);
    const ctx = this.bgCanvas.get2DContext();

    ctx.clearRect(0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    this.histogram.bins.forEach((bin) => {
      const yIndex = Math.floor(
        affine(
          this.histogram.y.extent[0],
          bin.y,
          this.histogram.y.extent[1],
          0,
          height - 1
        )
      );
      const xIndex = Math.floor(
        affine(
          this.histogram.x.extent[0],
          bin.x,
          this.histogram.x.extent[1],
          0,
          width - 1
        )
      );
      const offset = yIndex * (imageData.width * 4) + xIndex * 4;
      const scale = Math.floor(
        affine(
          0,
          bin.count,
          this.histogram.maxCount ? this.histogram.maxCount : 100,
          0,
          255
        )
      );
      imageData.data[offset + 0] = scale;
      imageData.data[offset + 1] = scale;
      imageData.data[offset + 2] = scale;
      imageData.data[offset + 3] = 255;
    });
    ctx.putImageData(imageData, 0, 0);

    // Let everyone know the image is ready
    this.imageReady({
      canvas: this.bgCanvas.el,
      imageData,
      area: [0, 0, width, height],
      outputSize: [width, height],
      builder: this,
      arguments: this.queryDataModel.getQuery(),
    });
  }
}
