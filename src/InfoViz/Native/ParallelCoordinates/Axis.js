export default class Axis {
  constructor(name, range = [0, 1]) {
    this.name = name;
    this.range = [].concat(range);
    this.upsideDown = false;
    this.selections = [];
  }

  toggleOrientation() {
    this.upsideDown = !this.upsideDown;
  }

  isUpsideDown() {
    return this.upsideDown;
  }

  hasSelection() {
    return (this.selections.length > 0);
  }

  updateRange(newRange) {
    if (this.range[0] !== newRange[0] || this.range[1] !== newRange[1] || this.range[1] === this.range[0]) {
      this.range[0] = newRange[0];
      this.range[1] = newRange[1];
      if (this.range[0] === this.range[1]) {
        this.range[1] += 1;
      }
    }
  }

  updateSelection(selectionIndex, start, end) {
    const entry = this.selections[selectionIndex].interval = [start, end];

    // Clamp to axis range
    if (start < this.range[0]) {
      entry[0] = this.range[0];
    }

    if (end > this.range[1]) {
      entry[1] = this.range[1];
    }

    // FIXME trigger notification
  }

  addSelection(start, end, endpoints = '**', uncertainty) {
    const interval = [
      start < this.range[0] ? this.range[0] : start,
      end < this.range[1] ? end : this.range[1],
    ];
    this.selections.push({ interval, endpoints, uncertainty });
  }

  clearSelection() {
    this.selections = [];
  }
}
