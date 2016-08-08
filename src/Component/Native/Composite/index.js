/* global document */

import style from 'PVWStyle/ComponentNative/Composite.mcss';

export default class NativeCompositeComponent {
  constructor(el) {
    this.container = null;
    this.viewports = [];
    this.styles = [];
    this.setContainer(el);
  }

  addViewport(viewport, expand = true) {
    this.viewports.push(viewport);
    const css = expand ? style.viewport : style.fixViewport;
    this.styles.push(css);

    if (this.container) {
      const subElem = document.createElement('div');
      subElem.classList.add(css);
      this.container.appendChild(subElem);
      viewport.setContainer(subElem);
    }
  }

  clearViewports() {
    while (this.viewports.length) {
      this.viewports.pop().setContainer(null);
      this.styles.pop();
    }
  }

  setContainer(el) {
    if (this.container && this.container !== el) {
      // Remove us from previous container
      this.container.classList.remove(style.container);
      this.viewports.forEach(viewport => viewport.setContainer(null));
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }

    this.container = el;
    if (this.container) {
      this.container.classList.add(style.container);
      this.viewports.forEach((viewport, idx) => {
        const subElem = document.createElement('div');
        subElem.classList.add(this.styles[idx]);
        this.container.appendChild(subElem);
        viewport.setContainer(subElem);
      });
    }
  }

  resize() {
    this.viewports.forEach(viewport => viewport.resize());
  }

  render() {
    this.viewports.forEach(viewport => viewport.render());
  }

  destroy() {
    this.clearViewports();
    this.setContainer(null);
  }
}
