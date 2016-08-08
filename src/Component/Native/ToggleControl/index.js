/* global document */

import style from 'PVWStyle/ComponentNative/ToggleControl.mcss';

const SELECTOR_BUTTON_CLASS = style.jsControlButton;

export default class CompositeControlContainer {
  constructor(mainViewport, controlViewport, width = 350) {
    this.container = null;
    this.controlVisible = false;
    this.mainViewport = mainViewport;
    this.controlViewport = controlViewport;
    this.targetWidth = width;

    this.toggleControl = () => {
      this.controlVisible = !this.controlVisible;
      if (this.container) {
        this.container.querySelector(`.${style.jsControlContent}`).style.display = this.controlVisible ? 'flex' : 'none';
        setImmediate(() => this.resize());
      }
    };
  }

  setContainer(el) {
    if (this.container && this.container !== el) {
      // Remove listener
      const button = this.container.querySelector(`.${SELECTOR_BUTTON_CLASS}`);
      if (button) {
        button.removeEventListener('click', this.toggleControl);
      }

      this.mainViewport.setContainer(null);
      this.controlViewport.setContainer(null);

      // Remove us from previous container
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }

    this.container = el;
    if (this.container) {
      const mainContainer = document.createElement('div');
      mainContainer.classList.add(style.container);
      this.container.appendChild(mainContainer);
      this.mainViewport.setContainer(mainContainer);

      const controlContainer = document.createElement('div');
      controlContainer.classList.add(style.control);
      controlContainer.innerHTML = `<div><i class="${style.toggleControlButton}"></i></div><div class="${style.controlContent}"></div>`;
      this.container.appendChild(controlContainer);

      this.controlViewport.setContainer(controlContainer.querySelector(`.${style.jsControlContent}`));

      // Add button listener
      const button = controlContainer.querySelector(`.${SELECTOR_BUTTON_CLASS}`);
      if (button) {
        button.addEventListener('click', this.toggleControl);
      }

      this.resize();
    }
  }

  resize() {
    if (!this.container) {
      return;
    }

    const controlDiv = this.container.querySelector(`.${style.jsControlContent}`);
    const rect = this.container.getClientRects()[0];

    if (rect) {
      const { height, width } = rect;
      const controlWidth = width < (this.targetWidth + 20) ? (width - 20) : this.targetWidth;

      controlDiv.style.width = `${controlWidth}px`;
      controlDiv.style.height = `${height - 45}px`;

      this.mainViewport.resize();
      this.controlViewport.resize();

      this.render();
    }
  }

  render() {
    this.mainViewport.render();
    this.controlViewport.render();
  }

  destroy() {
    this.setContainer(null);
    this.mainViewport.destroy();
    this.controlViewport.destroy();
    this.mainViewport = null;
    this.controlViewport = null;
  }
}
