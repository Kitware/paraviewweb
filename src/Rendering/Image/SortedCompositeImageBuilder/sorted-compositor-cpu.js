import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';
import { loop } from '../../../Common/Misc/Loop';

export default class SortedVolumeCompositor {

  constructor(queryDataModel, imageBuilder, colorTable, reverseCompositePass) {
    this.queryDataModel = queryDataModel;
    this.imageBuilder = imageBuilder;
    this.metadata = this.queryDataModel.originalData.SortedComposite;
    this.orderData = null;
    this.alphaData = null;
    this.intensityData = null;
    this.numLayers = this.metadata.layers;
    this.colorTable = colorTable;
    this.reverseCompositePass = reverseCompositePass;

    this.width = this.metadata.dimensions[0];
    this.height = this.metadata.dimensions[1];
    this.bgCanvas = new CanvasOffscreenBuffer(this.width, this.height);
    this.imageBuffer = this.bgCanvas.get2DContext().createImageData(this.width, this.height);
  }

  // --------------------------------------------------------------------------

  updateData(data) {
    this.orderData = new Uint8Array(data.order.data);
    this.alphaData = new Uint8Array(data.alpha.data);
    if (data.intensity) {
      this.intensityData = new Uint8Array(data.intensity.data);
    } else {
      this.intensityData = null;
    }
  }

  // --------------------------------------------------------------------------

  setLayerColors(colorTable) {
    this.colorTable = colorTable;
  }

  // --------------------------------------------------------------------------

  render() {
    if (!this.alphaData || !this.orderData || !this.colorTable) {
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
            layerIdx = this.orderData[(drawIdx * imageSize) + idx],
            multiplier = this.colorTable[(layerIdx * 4) + 3] / 255.0,
            alphB = this.alphaData[(drawIdx * imageSize) + idx] / 255.0;

          let intensity = 1.0;

          if (this.intensityData) {
            intensity = this.intensityData[(drawIdx * imageSize) + idx] / 255.0;
          }

          // Blend
          const alphA = pixels[(flipIdx * 4) + 3] / 255.0,
            alphANeg = 1.0 - alphA,
            rgbA = [pixels[flipIdx * 4], pixels[(flipIdx * 4) + 1], pixels[(flipIdx * 4) + 2]],
            rgbB = [
              this.colorTable[layerIdx * 4] * intensity * alphB * multiplier * alphANeg,
              this.colorTable[(layerIdx * 4) + 1] * intensity * alphB * multiplier * alphANeg,
              this.colorTable[(layerIdx * 4) + 2] * intensity * alphB * multiplier * alphANeg,
            ],
            alphOut = alphA + (alphB * multiplier * (1.0 - alphA));

          pixels[flipIdx * 4] = ((rgbA[0] * alphA) + rgbB[0]) / alphOut;
          pixels[(flipIdx * 4) + 1] = ((rgbA[1] * alphA) + rgbB[1]) / alphOut;
          pixels[(flipIdx * 4) + 2] = ((rgbA[2] * alphA) + rgbB[2]) / alphOut;
          pixels[(flipIdx * 4) + 3] = alphOut * 255.0;
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
}
