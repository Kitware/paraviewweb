/* eslint-disable class-methods-use-this */

export default class NativeBackgroundColorComponent {
  constructor(color, el) {
    this.color = color;
    this.setContainer(el);
    this.previousColor = '';
  }

  /*
   * We must not mess with the position properties of the style on the container
   * we are given, or we will break the workbench layout functionality!  Setting the
   * background color is fine, however, as long as we don't use the setAttribute()
   * approach to this.  Also, we could always create our own container
   * within the element we are given, and we can do whatever we want with that.
   */

  setContainer(el) {
    if (this.el) {
      this.el.style['background-color'] = this.previousColor;
    }

    this.el = el;

    if (el) {
      this.previousColor = this.el.style['background-color'];
      this.el.style['background-color'] = this.color;
    }
  }

  render() {}

  resize() {}

  destroy() {}
}
