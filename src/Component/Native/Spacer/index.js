/* global document */
/* eslint-disable class-methods-use-this */

export default class NativeSpacerComponent {
  constructor(size = '30px') {
    this.container = null;
    this.size = size;
    this.spacer = document.createElement('div');
    this.spacer.style.position = 'relative';
    this.spacer.style.width = size;
    this.spacer.style.height = size;
  }

  setContainer(el) {
    if (this.container && this.container !== el) {
      // Remove us from previous container
      this.container.removeChild(this.spacer);
    }

    this.container = el;
    if (this.container) {
      this.container.appendChild(this.spacer);
    }
  }

  resize() {
  }

  render() {
  }

  destroy() {
    this.setContainer(null);
  }
}
