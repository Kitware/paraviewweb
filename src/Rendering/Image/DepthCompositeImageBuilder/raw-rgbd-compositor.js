import max from 'mout/object/max';

import CanvasOffscreenBuffer from '../../../Common/Misc/CanvasOffscreenBuffer';
import WebGlUtil from '../../../Common/Misc/WebGl';
import PingPong from '../../../Common/Misc/PingPong';

import vertexShader from '../../../Common/Misc/WebGl/shaders/vertex/basic.c';
import fragmentShaderDisplay from './shaders/fragment/display.c';
import fragmentShaderComposite from './shaders/fragment/composite.c';

export default class BinaryCompositor {

  constructor({ queryDataModel, imageBuilder }) {
    this.queryDataModel = queryDataModel;
    this.imageBuilder = imageBuilder;
    this.rgbdData = null;
    this.offsetList = [];
    this.spriteSize = max(this.queryDataModel.originalData.CompositePipeline.offset);

    this.dataSubscription = queryDataModel.onDataChange((data, envelope) => {
      this.rgbdData = data.rgbdSprite.data;
      this.render();
    });

    this.width = this.queryDataModel.originalData.CompositePipeline.dimensions[0];
    this.height = this.queryDataModel.originalData.CompositePipeline.dimensions[1];
    this.glCanvas = new CanvasOffscreenBuffer(this.width, this.height);

    // Inialize GL context
    this.gl = this.glCanvas.get3DContext();
    if (!this.gl) {
      console.error('Unable to get WebGl context');
      return;
    }

    // Set clear color to white, fully transparent
    this.gl.clearColor(1.0, 1.0, 1.0, 0.0);

    // Set up GL resources
    this.glConfig = {
      programs: {
        displayProgram: {
          vertexShader,
          fragmentShader: fragmentShaderDisplay,
          mapping: 'default',
        },
        compositeProgram: {
          vertexShader,
          fragmentShader: fragmentShaderComposite,
          mapping: 'default',
        },
      },
      resources: {
        buffers: [
          {
            id: 'texCoord',
            data: new Float32Array([
              0.0, 0.0,
              1.0, 0.0,
              0.0, 1.0,
              0.0, 1.0,
              1.0, 0.0,
              1.0, 1.0,
            ]),
          }, {
            id: 'posCoord',
            data: new Float32Array([-1, -1,
              1, -1, -1, 1, -1, 1,
              1, -1,
              1, 1,
            ]),
          },
        ],
        textures: [
          {
            id: 'texture2D',
            pixelStore: [
              ['UNPACK_FLIP_Y_WEBGL', true],
            ],
            texParameter: [
              ['TEXTURE_MAG_FILTER', 'NEAREST'],
              ['TEXTURE_MIN_FILTER', 'NEAREST'],
              ['TEXTURE_WRAP_S', 'CLAMP_TO_EDGE'],
              ['TEXTURE_WRAP_T', 'CLAMP_TO_EDGE'],
            ],
          }, {
            id: 'ping',
            pixelStore: [
              ['UNPACK_FLIP_Y_WEBGL', true],
            ],
            texParameter: [
              ['TEXTURE_MAG_FILTER', 'NEAREST'],
              ['TEXTURE_MIN_FILTER', 'NEAREST'],
              ['TEXTURE_WRAP_S', 'CLAMP_TO_EDGE'],
              ['TEXTURE_WRAP_T', 'CLAMP_TO_EDGE'],
            ],
          }, {
            id: 'pong',
            pixelStore: [
              ['UNPACK_FLIP_Y_WEBGL', true],
            ],
            texParameter: [
              ['TEXTURE_MAG_FILTER', 'NEAREST'],
              ['TEXTURE_MIN_FILTER', 'NEAREST'],
              ['TEXTURE_WRAP_S', 'CLAMP_TO_EDGE'],
              ['TEXTURE_WRAP_T', 'CLAMP_TO_EDGE'],
            ],
          },
        ],
        framebuffers: [
          {
            id: 'ping',
            width: this.width,
            height: this.height,
          }, {
            id: 'pong',
            width: this.width,
            height: this.height,
          },
        ],
      },
      mappings: {
        default: [
          {
            id: 'posCoord',
            name: 'positionLocation',
            attribute: 'a_position',
            format: [2, this.gl.FLOAT, false, 0, 0],
          }, {
            id: 'texCoord',
            name: 'texCoordLocation',
            attribute: 'a_texCoord',
            format: [2, this.gl.FLOAT, false, 0, 0],
          },
        ],
      },
    };

    this.glResources = WebGlUtil.createGLResources(this.gl, this.glConfig);

    this.pingPong = new PingPong(this.gl,
      [this.glResources.framebuffers.ping, this.glResources.framebuffers.pong],
      [this.glResources.textures.ping, this.glResources.textures.pong]);
  }

  // ------------------------------------------------------------------------

  extractLayerData(buffer, pixelOffset) {
    var px = 0,
      py = pixelOffset,
      offset = ((py * this.width) + px) * 4,
      length = this.width * this.height * 4;

    return new Uint8Array(buffer, offset, length);
  }

  // ------------------------------------------------------------------------

  updateQuery(query) {
    var layers = this.queryDataModel.originalData.CompositePipeline.layers,
      count = layers.length,
      offsets = this.queryDataModel.originalData.CompositePipeline.offset;

    this.offsetList = [];
    for (let idx = 0; idx < count; idx++) {
      const fieldCode = query[(idx * 2) + 1];
      if (fieldCode !== '_') {
        this.offsetList.push(this.spriteSize - offsets[layers[idx] + fieldCode]);
      }
    }
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.rgbdData) {
      return;
    }

    // Compute composite
    this.pingPong.clearFbo();
    this.offsetList.forEach((layerIdx) => {
      this.drawCompositePass(this.extractLayerData(this.rgbdData, layerIdx * this.height));
    });

    // Draw to display
    this.drawDisplayPass();

    const readyImage = {
      canvas: this.glCanvas.el,
      area: [0, 0, this.width, this.height],
      outputSize: [this.width, this.height],
      builder: this.imageBuilder,
    };

    this.imageBuilder.imageReady(readyImage);
  }

  // ------------------------------------------------------------------------

  destroy() {
    this.glCanvas.destroy();
    this.glCanvas = null;

    this.dataSubscription.unsubscribe();
    this.dataSubscription = null;

    this.glResources.destroy();
    this.glResources = null;

    this.pingPong = null;
  }

  // ------------------------------------------------------------------------

  drawDisplayPass() {
    // Draw to the screen framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    // Using the display shader program
    this.gl.useProgram(this.glResources.programs.displayProgram);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.viewport(0, 0, this.width, this.height);

    // Set up the sampler uniform and bind the rendered texture
    const uImage = this.gl.getUniformLocation(this.glResources.programs.displayProgram, 'u_image');
    this.gl.uniform1i(uImage, 0);
    this.gl.activeTexture(this.gl.TEXTURE0 + 0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.pingPong.getRenderingTexture());

    // Draw the rectangle.
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.finish();
  }

  // ------------------------------------------------------------------------

  drawCompositePass(layerData) {
    // Draw to the fbo on this pass
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pingPong.getFramebuffer());

    // Using the compositing shader program
    this.gl.useProgram(this.glResources.programs.compositeProgram);

    // this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.viewport(0, 0, this.width, this.height);

    // Set up the layer texture
    const layer = this.gl.getUniformLocation(this.glResources.programs.compositeProgram, 'layerSampler');
    this.gl.uniform1i(layer, 0);
    this.gl.activeTexture(this.gl.TEXTURE0 + 0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.glResources.textures.texture2D);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width, this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, layerData);

    // Set up the sampler uniform and bind the rendered texture
    const composite = this.gl.getUniformLocation(this.glResources.programs.compositeProgram, 'compositeSampler');
    this.gl.uniform1i(composite, 1);
    this.gl.activeTexture(this.gl.TEXTURE0 + 1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.pingPong.getRenderingTexture());

    // Draw the rectangle.
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.finish();

    // Ping-pong
    this.pingPong.swap();
  }

}
