import React from 'react';
import ReactDOM from 'react-dom';

export default class ReactContainer {
  constructor(reactClass, reactProps) {
    this.props = reactProps;
    this.reactClass = reactClass;
    this.container = null;
    this.component = null;
  }

  setContainer(el) {
    if (this.container && this.container !== el) {
      ReactDOM.unmountComponentAtNode(this.container);
      this.component = null;
    }
    this.container = el;
    if (this.container) {
      const View = this.reactClass;
      this.component = ReactDOM.render(<View {...this.props} />, this.container);
    }
  }

  resize() {
    this.render();
  }

  render() {
    if (this.component) {
      this.component.forceUpdate();
    } else if (this.container) {
      const View = this.reactClass;
      ReactDOM.render(<View {...this.props} />, this.container);
    }
  }

  destroy() {
    this.setContainer(null);
    this.reactClass = null;
    this.props = null;
    this.component = null;
  }
}
