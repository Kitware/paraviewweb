/**
 * The following method was adapted from code found here:
 *
 *    http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */

/* global window */
/* eslint-disable no-bitwise */

export function generateUUID() {
  let d = Date.now();
  if (window.performance && typeof window.performance.now === 'function') {
    d += window.performance.now(); // use high-precision timer if available
  }
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + (Math.random() * 16)) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
  return uuid;
}

export default {
  generateUUID,
};
