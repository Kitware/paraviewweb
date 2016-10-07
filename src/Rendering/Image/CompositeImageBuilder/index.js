import max from 'mout/object/max';

import AbstractImageBuilder from '../AbstractImageBuilder';
import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';

export default class CompositeImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(queryDataModel, pipelineModel) {
    super({ queryDataModel, pipelineModel, handleRecord: true, dimensions: queryDataModel.originalData.CompositePipeline.dimensions });

    this.metadata = queryDataModel.originalData.CompositePipeline;
    this.compositeMap = {};
    this.offsetMap = {};
    this.spriteSize = max(this.metadata.offset);
    this.query = null;
    this.composite = null;

    this.bgCanvas = new CanvasOffscreenBuffer(this.metadata.dimensions[0], this.metadata.dimensions[1]);
    this.registerObjectToFree(this.bgCanvas);

    this.fgCanvas = null;

    this.registerSubscription(queryDataModel.onDataChange((data, envelope) => {
      this.sprite = data.sprite;
      this.composite = data.composite.data['pixel-order'].split('+');
      this.updateCompositeMap(this.query, this.composite);
      this.render();
    }));

    this.registerSubscription(this.pipelineModel.onChange((data, envelope) => {
      this.setPipelineQuery(data);
    }));

    this.setPipelineQuery(this.pipelineModel.getPipelineQuery());
  }

  // ------------------------------------------------------------------------

  updateOffsetMap(query) {
    var layers = this.metadata.layers,
      count = layers.length,
      offsets = this.metadata.offset;

    this.offsetMap = {};
    this.compositeMap = {};
    for (let idx = 0; idx < count; idx++) {
      const fieldCode = query[(idx * 2) + 1];
      if (fieldCode === '_') {
        this.offsetMap[layers[idx]] = -1;
      } else {
        this.offsetMap[layers[idx]] = this.spriteSize - offsets[layers[idx] + fieldCode];
      }
    }
  }

  // ------------------------------------------------------------------------

  updateCompositeMap(query, composite) {
    if (query === null || composite === null) {
      return;
    }
    const compositeArray = composite,
      map = this.compositeMap;

    let count = compositeArray.length;
    while (count) {
      count -= 1;
      const key = compositeArray[count];
      if (key[0] === '@') {
        // Skip pixels
      } else if ({}.hasOwnProperty.call(map, key)) {
        // Already computed
      } else {
        let offset = -1;
        for (let i = 0, size = key.length; i < size; i++) {
          offset = this.offsetMap[key[i]];
          if (offset !== -1) {
            i = size;
          }
        }
        map[key] = offset;
      }
    }
  }

  // ------------------------------------------------------------------------

  pushToFrontAsImage(width, height) {
    var ctx = null;

    // Make sure we have a foreground buffer
    if (this.fgCanvas) {
      this.fgCanvas.size(width, height);
    } else {
      this.fgCanvas = new CanvasOffscreenBuffer(width, height);
      this.registerObjectToFree(this.fgCanvas);
    }

    ctx = this.fgCanvas.get2DContext();
    ctx.drawImage(this.bgCanvas.el, 0, 0, width, height, 0, 0, width, height);

    const readyImage = {
      url: this.fgCanvas.toDataURL(),
      builder: this,
    };

    // Let everyone know the image is ready
    this.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  pushToFrontAsBuffer(width, height) {
    var readyImage = {
      canvas: this.bgCanvas.el,
      imageData: this.bgCanvas.el.getContext('2d').getImageData(0, 0, width, height),
      area: [0, 0, width, height],
      outputSize: [width, height],
      builder: this,
      arguments: this.queryDataModel.getQuery(),
    };

    // Add pipeline info + ts
    readyImage.arguments.pipeline = this.query;

    // Let everyone know the image is ready
    this.imageReady(readyImage);

    // In case of exploration trigger next data fetch
    this.queryDataModel.nextExploration();
  }

  // ------------------------------------------------------------------------

  setPipelineQuery(query) {
    if (this.query !== query) {
      this.query = query;
      this.updateOffsetMap(query);
      this.updateCompositeMap(query, this.composite);
      this.render();
    }
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.sprite) {
      this.queryDataModel.fetchData();
      return;
    }
    if (this.query === null) {
      return;
    }

    const ctx = this.bgCanvas.get2DContext(),
      dimensions = this.metadata.dimensions,
      compositeArray = this.composite,
      count = compositeArray.length,
      modulo = dimensions[0];

    let offset = 1,
      x = 0,
      y = 0;

    function addToX(delta) {
      x += delta;
      y += Math.floor(x / modulo);
      x %= modulo;
    }

    if (this.sprite.image.complete) {
      // Free callback if any
      if (this.sprite.image.onload) {
        this.sprite.image.onload = null;
      }

      ctx.clearRect(0, 0, dimensions[0], dimensions[1]);
      for (let idx = 0; idx < count; idx++) {
        const key = compositeArray[idx];
        if (key[0] === '@') {
          // Shift (x,y)
          addToX(Number(key.replace(/@/, '+')));
        } else {
          offset = this.compositeMap[key];
          if (offset !== -1) {
            ctx.drawImage(this.sprite.image, x, y + (dimensions[1] * offset), 1, 1, x, y, 1, 1);
          }
          addToX(1);
        }
      }

      this.pushToFrontAsBuffer(dimensions[0], dimensions[1]);
    } else {
      this.sprite.image.onload = () => {
        this.render();
      };
    }
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.bgCanvas = null;
    this.fgCanvas = null;
    this.compositeMap = null;
    this.offsetMap = null;
  }
}
