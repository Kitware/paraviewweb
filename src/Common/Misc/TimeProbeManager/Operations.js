class mean {
  begin() {
    this.count = 0;
    this.sum = 0;
  }

  next(value) {
    if (isFinite(value)) {
      this.sum += value;
      this.count++;
    }
  }

  end() {
    if (this.count === 0) {
      return Number.NaN;
    }
    return this.sum / this.count;
  }
}

export const opertations = {
  mean,
};

export default function create(operationName) {
  return new opertations[operationName]();
}
