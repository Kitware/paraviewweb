import CompositeClosureHelper from './CompositeClosureHelper';
import LookupTable from './LookupTable';
import LookupTableManager from './LookupTableManager';

export function setImmediate(fn) {
  return setTimeout(fn, 0);
}

export default {
  CompositeClosureHelper,
  LookupTable,
  LookupTableManager,
};
