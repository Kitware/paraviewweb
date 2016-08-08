export function integer(val) {
  if (Array.isArray(val)) {
    return val.map(v => parseInt(v, 10));
  }
  return parseInt(val, 10);
}

export function double(val) {
  if (Array.isArray(val)) {
    return val.map(v => parseFloat(v));
  }
  return parseFloat(val);
}

export function string(val) {
  if (Array.isArray(val)) {
    return val.map(v => String(v));
  }
  return String(val);
}

export function boolean(val) {
  if (Array.isArray(val)) {
    return val.map(v => Boolean(v));
  }
  return Boolean(val);
}

export function proxy(val) {
  return (val);
}

export default {
  integer,
  int: integer,

  double,
  dbl: double,
  float: double,

  string,
  str: string,

  boolean,
  bool: boolean,

  proxy,
};
