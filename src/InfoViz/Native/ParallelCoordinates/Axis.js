const to5clause = (axis, range) => [
  range[0],
  '<=',
  axis.name,
  '<=',
  range[1],
  { type: '5C' },
];


export default class Axis {
  constructor(name, range = [0, 1]) {
    this.name = name;
    this.range = range;
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

  getPredicates() {
    switch (this.selections.length) {
      case 0:
        return null;
      case 1:
        return to5clause(this, this.selections[0]);
      default: {
        let count = this.selections.length;
        const predicates = [{ type: 'L|' }];
        while (count--) {
          predicates.push(to5clause(this, this.selections[count]));
          if (count) {
            predicates.push('||');
          }
        }
        // Flip array to have the proper order
        return predicates.reverse();
      }
    }
  }

  updateSelection(selectionIndex, start, end) {
    const entry = this.selections[selectionIndex] = [start, end];

    if (start < this.range[0]) {
      entry[0] = this.range[0];
    }

    if (end > this.range[1]) {
      entry[1] = this.range[1];
    }

    // FIXME trigger notification
  }

  addSelection(start, end) {
    const entry = [
      start < this.range[0] ? this.range[0] : start,
      end < this.range[1] ? end : this.range[1],
    ];
    this.selections.push(entry);
  }

  clearSelection() {
    this.selections = [];
  }
}
