import { bindTextureToFramebuffer } from '../WebGl';

export class PingPong {

  constructor(gl, fbos, textures) {
    this.gl = gl;
    this.idx = 0;
    this.fbos = fbos;
    this.textures = textures;

    bindTextureToFramebuffer(this.gl, this.fbos[0], this.textures[1]);
    bindTextureToFramebuffer(this.gl, this.fbos[1], this.textures[0]);
  }

  swap() {
    this.idx++;
    this.idx %= 2;
  }

  clearFbo() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbos[0]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbos[1]);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.idx = 0;
  }

  getFramebuffer() {
    return this.fbos[this.idx];
  }

  getRenderingTexture() {
    return this.textures[this.idx];
  }
}
