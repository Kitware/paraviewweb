import Observable from 'paraviewweb/src/Common/Misc/Observable';
import { debounce } from 'paraviewweb/src/Common/Misc/Debounce';

/* eslint-disable no-use-before-define */

const observableInstance = new Observable();
const TOPIC = 'window.size.change';
const domSizes = new WeakMap();
const sizeProperties = [
  'scrollWidth',
  'scrollHeight',
  'clientWidth',
  'clientHeight',
];
const windowListener = debounce(invalidateSize, 250);

let timestamp = 0;
let listenerAttached = false;

// ------ internal functions ------

function updateSize(domElement, cacheObj) {
  if (cacheObj.timestamp < timestamp) {
    sizeProperties.forEach((prop) => {
      cacheObj[prop] = domElement[prop];
    });
    cacheObj.clientRect = domElement.getClientRects()[0];
  }
}

// ------ New API ------

function getSize(domElement, clearCache = false) {
  let cachedSize = domSizes.get(domElement);
  if (!cachedSize || clearCache) {
    cachedSize = { timestamp: -1 };
    domSizes.set(domElement, cachedSize);
  }
  updateSize(domElement, cachedSize);

  return cachedSize;
}

let observer = null;

class Subscriber {
  constructor(domElement, callback) {
    observer.observe(domElement);
    this.fn = observableInstance.on(TOPIC, callback);
    this.domElement = domElement;
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  unsubscribe() {
    observer.unobserve(this.domElement);
    this.fn.unsubscribe();
  }
}

function onSizeChange(callback) {
  return observableInstance.on(TOPIC, callback);
}

function onSizeChangeForElement(domElement, callback) {
  if (!observer) {
    observer = new ResizeObserver(windowListener);
  }
  return new Subscriber(domElement, callback);
}

function triggerChange() {
  observableInstance.emit(TOPIC);
}

function isListening() {
  return listenerAttached;
}

function startListening() {
  if (!listenerAttached) {
    window.addEventListener('resize', windowListener);
    listenerAttached = true;
  }
}

function stopListening() {
  if (listenerAttached) {
    window.removeEventListener('resize', windowListener);
    listenerAttached = false;
  }
}

// ------ internal functions ------

function invalidateSize() {
  timestamp += 1;
  triggerChange();
}

// Export
export default {
  getSize,
  isListening,
  onSizeChange,
  onSizeChangeForElement,
  startListening,
  stopListening,
  triggerChange,
};
