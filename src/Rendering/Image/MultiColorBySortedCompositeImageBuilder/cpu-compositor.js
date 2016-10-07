import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';
import { loop } from '../../../Common/Misc/Loop';

export default class CPUCompositor {

  constructor(queryDataModel, imageBuilder, colorHelper, reverseCompositePass) {
    this.queryDataModel = queryDataModel;
    this.imageBuilder = imageBuilder;
    this.metadata = this.queryDataModel.originalData.SortedComposite;
    this.orderData = null;
    this.intensityData = null;
    this.colorHelper = colorHelper;
    this.numLayers = this.metadata.layers;
    this.reverseCompositePass = reverseCompositePass;

    this.width = this.metadata.dimensions[0];
    this.height = this.metadata.dimensions[1];
    this.bgCanvas = new CanvasOffscreenBuffer(this.width, this.height);
    this.imageBuffer = this.bgCanvas.get2DContext().createImageData(this.width, this.height);
  }

  // --------------------------------------------------------------------------

  updateData(data) {
    this.orderData = new Uint8Array(data.order.data);
    if (data.intensity) {
      this.intensityData = new Uint8Array(data.intensity.data);
    } else {
      this.intensityData = null;
    }
  }

  // --------------------------------------------------------------------------

  render() {
    if (!this.orderData) {
      return;
    }

    const imageSize = this.width * this.height,
      pixels = this.imageBuffer.data,
      height = this.height,
      width = this.width,
      ctx = this.bgCanvas.get2DContext();

    // Reset pixels
    if (pixels.fill) {
      pixels.fill(0);
    } else {
      let count = width * height * 4;
      while (count) {
        count -= 1;
        pixels[count] = 0;
      }
    }

    // Just iterate through all the layers in the data for now
    loop(!!this.reverseCompositePass, this.numLayers, (drawIdx) => {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (this.width * y) + x,
            flipIdx = (((height - y - 1) * width) + x),
            layerIdx = this.orderData[(drawIdx * imageSize) + idx];

          let intensity = 1.0;

          // Skip pixels (bg | not visible)
          if (layerIdx === 255 || this.colorHelper.hasNoContent(layerIdx)) {
            /* eslint-disable no-continue */
            continue;
            /* eslint-enable no-continue */
          }

          if (this.intensityData) {
            intensity = this.intensityData[(drawIdx * imageSize) + idx] / 255.0;
          }

          // Blend
          const alphA = pixels[(flipIdx * 4) + 3] / 255.0,
            alphANeg = 1.0 - alphA,
            rgbA = [pixels[flipIdx * 4], pixels[(flipIdx * 4) + 1], pixels[(flipIdx * 4) + 2]],
            pixelRGBA = this.colorHelper.getColor(layerIdx, idx),
            alphaB = pixelRGBA[3] / 255.0,
            rgbB = [
              pixelRGBA[0] * intensity * alphaB * alphANeg,
              pixelRGBA[1] * intensity * alphaB * alphANeg,
              pixelRGBA[2] * intensity * alphaB * alphANeg,
            ],
            alphOut = alphA + (alphaB * (1.0 - alphA));

          if (alphaB > 0) {
            pixels[flipIdx * 4] = ((rgbA[0] * alphA) + rgbB[0]) / alphOut;
            pixels[(flipIdx * 4) + 1] = ((rgbA[1] * alphA) + rgbB[1]) / alphOut;
            pixels[(flipIdx * 4) + 2] = ((rgbA[2] * alphA) + rgbB[2]) / alphOut;
            pixels[(flipIdx * 4) + 3] = alphOut * 255.0;
          } else {
            console.log('no alpha while skip should have worked', pixelRGBA[3]);
          }
        }
      }
    });

    // Draw the result to the canvas
    ctx.putImageData(this.imageBuffer, 0, 0);

    const readyImage = {
      canvas: this.bgCanvas.el,
      area: [0, 0, this.width, this.height],
      outputSize: [this.width, this.height],
      builder: this.imageBuilder,
      arguments: this.queryDataModel.getQuery(),
    };

    this.imageBuilder.imageReady(readyImage);
  }

  // --------------------------------------------------------------------------

  destroy() {
    this.bgCanvas.destroy();
    this.bgCanvas = null;

    this.queryDataModel = null;
    this.imageBuilder = null;
  }

  // --------------------------------------------------------------------------
  // Lighting Widget called methods
  // --------------------------------------------------------------------------

  /* eslint-disable class-methods-use-this */
  getLightProperties() {
    return {};
  }

  // --------------------------------------------------------------------------

  setLightProperties(lightProps) {
    // this.lightProperties = merge(this.lightProperties, lightProps);
  }
}
