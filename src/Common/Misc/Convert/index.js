export function integer(val) {
  return parseInt(val, 10);
}

export function double(val) {
  return parseFloat(val);
}

export function string(val) {
  return String(val);
}
  
export function boolean(val) {
  return Boolean(val);
}

export default {
  integer, int: integer,
  double, dbl: double,
  string, str: string,
  boolean, bool: boolean,
}
