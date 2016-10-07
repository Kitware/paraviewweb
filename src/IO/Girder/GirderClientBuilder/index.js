/* global window EventSource document */

import axios from 'axios';
import Monologue from 'monologue.js';

// ----------------------------------------------------------------------------
const AUTH_CHANGE_TOPIC = 'girder.auth.change';
const BUSY_TOPIC = 'girder.busy';
const PROGRESS_TOPIC = 'girder.progress';
const EVENT_TOPIC = 'girder.notification';

class Observable {}
Monologue.mixInto(Observable);

const loginPromiseBuilder = () => new Promise((resolve, reject) => {
  resolve();
});
const logoutPromiseBuilder = () => new Promise((resolve, reject) => {
  reject();
});
// ----------------------------------------------------------------------------

function encodeQueryAsString(query = {}) {
  const params = Object.keys(query).map(name => [encodeURIComponent(name), encodeURIComponent(query[name])].join('='));
  return params.length ? `?${params.join('&')}` : '';
}

// ----------------------------------------------------------------------------

function filterQuery(query = {}, ...keys) {
  const out = {};
  keys.forEach((key) => {
    if (query[key] !== undefined && query[key] !== null) {
      out[key] = query[key];
    }
  });
  return out;
}

// ----------------------------------------------------------------------------

function mustContain(object = {}, ...keys) {
  var missingKeys = [],
    promise;
  keys.forEach((key) => {
    if (object[key] === undefined) {
      missingKeys.push(key);
    }
  });
  if (missingKeys.length === 0) {
    missingKeys = undefined;
    promise = new Promise((resolve, reject) => resolve());
  } else {
    promise = new Promise((resolve, reject) => reject(`Missing keys ${missingKeys.join(', ')}`));
  }

  return {
    missingKeys, promise,
  };
}

// ----------------------------------------------------------------------------

export function build(config = window.location, ...extensions) {
  var userData,
    token,
    loginPromise,
    isAuthenticated = false,
    eventSource = null,
    busyCounter = 0;

  const
    client = {}, // Must be const otherwise the created closure will fail
    notification = new Observable(),
    idle = () => {
      busyCounter -= 1;
      notification.emit(BUSY_TOPIC, busyCounter);
    },
    busy = (promise) => {
      busyCounter += 1;
      notification.emit(BUSY_TOPIC, busyCounter);
      promise.then(idle, idle);
      return promise;
    },
    {
      protocol, hostname, port, basepath = '/api/v1',
    } = config,
    baseURL = `${protocol}//${hostname}:${port}${basepath}`,
    connectToNotificationStream = () => {
      if (EventSource) {
        eventSource = new EventSource(`${baseURL}/notification/stream`);
        eventSource.onmessage = (e) => {
          var parsed = JSON.parse(e.data);
          notification.emit(EVENT_TOPIC, parsed);
        };

        eventSource.onerror = (e) => {
          // Wait 10 seconds if the browser hasn't reconnected then
          // reinitialize.
          setTimeout(() => {
            if (eventSource && eventSource.readyState === 2) {
              connectToNotificationStream();
            } else {
              eventSource = null;
            }
          }, 10000);
        };
      }
    },
    {
      extractLocalToken, updateGirderInstance, updateAuthenticationState,
    } = {
      extractLocalToken() {
        try {
          return document.cookie.split('girderToken=')[1].split(';')[0].trim();
        } catch (e) {
          return undefined;
        }
      },
      updateGirderInstance() {
        const timeout = 60000;
        const headers = {};

        if (token) {
          headers['Girder-Token'] = token;
        }

        client._ = axios.create({
          baseURL, timeout, headers,
        });
      },
      updateAuthenticationState(state) {
        if (isAuthenticated !== !!state) {
          // Clear cache data if not logged-in
          if (!state) {
            userData = undefined;
            token = undefined;
            // Update userData for external modules
            client.user = userData;
            client.token = undefined;
          }

          // Update internal state
          isAuthenticated = !!state;
          updateGirderInstance();

          // Broadcast information
          /* eslint-disable babel/new-cap */
          loginPromise = state ? loginPromiseBuilder() : logoutPromiseBuilder();
          /* eslint-enable babel/new-cap */
          notification.emit(AUTH_CHANGE_TOPIC, isAuthenticated);
          if (isAuthenticated && eventSource === null) {
            connectToNotificationStream();
          }
        }
      },
    },
    progress = (id, current, total = 1) => {
      notification.emit(PROGRESS_TOPIC, {
        id, current, total,
      });
    };

  // Fill up public object
  const publicObject = {
    login(username, password) {
      const auth = {
        username, password,
      };
      return busy(client._
        .get('/user/authentication', {
          auth,
        })
        .then((resp) => {
          token = resp.data.authToken.token;
          userData = resp.data.user;

          // Update userData for external modules
          client.user = userData;
          client.token = token;

          updateAuthenticationState(true);
        }));
    },

    logout() {
      return busy(client._.delete('/user/authentication')
        .then(
          (ok) => {
            updateAuthenticationState(false);
            if (document && document.cookie) {
              document.cookie = 'Girder-Token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
          },
          (ko) => {
            console.log('loggout error', ko);
          })
      );
    },

    me() {
      return busy(client._.get('/user/me'));
    },

    isLoggedIn() {
      return loginPromise;
    },

    getLoggedInUser() {
      return userData;
    },

    onAuthChange(callback) {
      return notification.on(AUTH_CHANGE_TOPIC, callback);
    },

    onBusy(callback) {
      return notification.on(BUSY_TOPIC, callback);
    },

    onProgress(callback) {
      return notification.on(PROGRESS_TOPIC, callback);
    },

    onEvent(callback) {
      return notification.on(EVENT_TOPIC, callback);
    },

    destroy() {
      notification.off();
    },
  };

  // Try to extract token from
  loginPromise = new Promise((accept, reject) => {
    token = config.token || extractLocalToken();
    updateGirderInstance();
    if (token) {
      publicObject.me()
        .then(
          (resp) => {
            userData = resp.data;

            // Update userData for external modules
            client.user = userData;
            client.token = token;
            updateAuthenticationState(true);
            accept();
          },
          (errResp) => {
            updateAuthenticationState(false);
            reject();
          });
    } else {
      reject();
    }
  });

  // Expend client
  client.baseURL = baseURL;

  // Add extensions
  const spec = {
    busy,
    client,
    encodeQueryAsString,
    filterQuery,
    mustContain,
    notification,
    progress,
  };

  function processExtension(ext) {
    if (Array.isArray(ext)) {
      ext.forEach(processExtension);
    } else {
      const obj = ext(spec);
      Object.keys(obj).forEach((key) => {
        publicObject[key] = obj[key];
      });
    }
  }

  processExtension(extensions);

  // Return the newly composed object
  return Object.freeze(publicObject);
}

export default {
  build,
};
