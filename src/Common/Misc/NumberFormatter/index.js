import d3 from 'd3';

/** \brief A formatter for numeric values.
  *
  * Unlike d3.format or others, instances of this class keep either
  * a set of numeric values and a fixed precision. The precision used
  * to report values is **at most** either (1) the fixed precision or
  * (2) the precision required to differentiate the number from the
  * nearest elements in the set.
  *
  * This is useful so that the user interface does not force a loss
  * in precision when users want a small range (centered far from the
  * origin).
  *
  * The default fixed precision is 3 digits.
  *
  * Engineering notation (exponential notation with an exponent that
  * is a multiple of 3) is only used when the absolute value of the
  * number is more than 1e5.
  */
export default class NumberFormatter {

  constructor(prec, src) {
    this.fixedPrecision = prec;
    if (!this.fixedPrecision || this.fixedPrecision < 1) {
      this.fixedPrecision = 3;
    }
    this.numbers = null;
    if (src) {
      this.set(src);
    }
  }

  set(src) {
    this.numbers = [...src].sort((a, b) => a - b);
  }

  add(num) {
    if (!isFinite(num)) {
      return -1;
    }
    if (!this.numbers) {
      this.numbers = [num];
      return 0;
    }
    if (this.numbers.length > 0) {
      const i0 = d3.bisectLeft(this.numbers, num);
      if (this.numbers[i0] === num) {
        return i0;
      }
    }
    const i1 = d3.bisectRight(this.numbers, num);
    this.numbers = this.numbers.slice(0, i1).concat(num).concat(this.numbers.slice(i1, this.numbers.length));
    return i1;
  }

  del(num) {
    if (!isFinite(num) || !this.numbers) {
      return -1;
    }
    if (this.numbers.length > 0) {
      const i0 = d3.bisectLeft(this.numbers, num);
      if (this.numbers[i0] === num) {
        this.numbers = this.numbers.slice(0, i0).concat(this.numbers.slice(i0 + 1, this.numbers.length));
        return i0;
      }
    }
    return -1;
  }

  eval(num) {
    // I. Handle special numbers:
    if (num === 0.0) {
      return '0';
    } else if (num === Infinity) {
      return '∞';
    } else if (num === -Infinity) {
      return '-∞';
    } else if (isNaN(num)) {
      return 'NaN';
    }
    const szn = Math.log10(Math.abs(num));
    let prec = this.fixedPrecision;
    if (this.numbers) {
      const i0 = d3.bisectLeft(this.numbers, num) - 1;
      const i1 = d3.bisectRight(this.numbers, num);
      if (i0 >= 0 && i0 < this.numbers.length) {
        const dnl = num - this.numbers[i0];
        const ld0 = Math.ceil(szn - Math.log10(dnl)); // Need this much precision to distinguish
        // console.log(' dnl ', dnl, ' ld0 ', ld0, ' i0 ', i0);
        if (ld0 > prec) {
          prec = ld0;
        }
      }
      if (i1 > i0 && i1 < this.numbers.length) {
        const dnr = this.numbers[i1] - num;
        const ld1 = Math.ceil(szn - Math.log10(dnr));
        // console.log(' dnr ', dnr, ' ld1 ', ld1, ' i1 ', i1);
        if (ld1 > prec) {
          prec = ld1;
        }
      }
    }
    if (szn <= 3.0 && szn > -2) {
      return num.toFixed(prec - Math.floor(szn));
    }
    const exponent = -Math.floor(Math.log10(Math.abs(num)) / 3) * 3;
    const scaled = Math.pow(10, exponent) * num;
    // console.log(' sca ', scaled, ' exp ', exponent, ' szn ', szn, ' prec ', prec);
    return scaled.toFixed(prec - Math.ceil(szn + exponent)).concat('e').concat(-exponent.toFixed());
  }

  evaluator() {
    const self = this;
    return o => self.eval(o);
  }
}

// provide a convenient regExp string for numbers
export const sciNotationRegExp = '[-+]?[0-9]*[.]?[0-9]*[eE]?[-+]?[0-9]*';
