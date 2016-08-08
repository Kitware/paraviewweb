export function integer(val) {
  return Number.isInteger(parseInt(val, 10));
}

export function double(val) {
  return !isNaN(parseFloat(val));
}

export function string(val) {
  return typeof val === 'string' || val instanceof String;
}

export function boolean(val) {
  return typeof val === 'boolean';
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
};
