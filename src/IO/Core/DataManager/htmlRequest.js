import { toByteArray } from 'base64-js';

function getContent(url) {
  const el = document.querySelector(`.webResource[data-url="${url}"]`);
  return el ? el.innerHTML : null;
}

function text(url, cb) {
  const txt = getContent(url);
  if (txt === null) {
    cb(`No such resource ${url}`);
  } else {
    cb(null, txt);
  }
}

function json(url, cb) {
  const txt = getContent(url);
  if (txt === null) {
    cb(`No such resource ${url}`);
  } else {
    cb(null, JSON.parse(txt));
  }
}

function array(url, cb) {
  const txt = getContent(url);
  if (txt === null) {
    cb(`No such resource ${url}`);
  } else {
    cb(null, toByteArray(txt));
  }
}

function blob(url, mimeType, cb) {
  const txt = getContent(url);
  if (txt === null) {
    cb(`No such resource ${url}`);
  } else {
    const buffer = toByteArray(txt);
    cb(null, new Blob([buffer], { type: mimeType }));
  }
}

// Export fetch methods
export default {
  json,
  text,
  blob,
  array,
};
