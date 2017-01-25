/* global window */

import Observable   from '../Observable';
import { debounce } from '../Debounce';

/* eslint-disable no-use-before-define */

const observableInstance = new Observable();
const TOPIC = 'window.size.change';
const domSizes = new WeakMap();
const sizeProperties = ['scrollWidth', 'scrollHeight', 'clientWidth', 'clientHeight'];
let wait = 250;
let windowListener = debounce(invalidateSize, wait);

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
  var cachedSize = domSizes.get(domElement);
  if (!cachedSize || clearCache) {
    cachedSize = { timestamp: -1 };
    domSizes.set(domElement, cachedSize);
  }
  updateSize(domElement, cachedSize);

  return cachedSize;
}

function onSizeChange(callback) {
  return observableInstance.on(TOPIC, callback);
}

function triggerChange() {
  observableInstance.emit(TOPIC);
}

function isListening() {
  return listenerAttached;
}

function startListening(timeout = 250) {
  if (timeout !== wait) {
    wait = timeout;
    windowListener = debounce(invalidateSize, wait);
  }
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
  startListening,
  stopListening,
  triggerChange,
};
