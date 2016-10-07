/* global Image */

import hasOwn from 'mout/object/hasOwn';
import max from 'mout/object/max';
import min from 'mout/object/min';
import Monologue from 'monologue.js';
import now from 'mout/src/time/now';
import omit from 'mout/object/omit';
import size from 'mout/object/size';

import DataManager from '../DataManager';

// ============================================================================
const
  dataManager = new DataManager(),
  DEFAULT_KEY_NAME = '_';
// ============================================================================
var
  queryDataModelCounter = 0;
// ============================================================================

// Helper function used to handle next/previous when the loop function is 'reverse'
function deltaReverse(arg, increment) {
  var newIdx = arg.idx + (arg.direction * increment);
  if (newIdx >= arg.values.length) {
    arg.direction *= -1; // Reverse direction
    newIdx = arg.values.length - 2;
  }

  if (newIdx < 0) {
    arg.direction *= -1; // Reverse direction
    newIdx = 1;
  }

  if (newIdx >= 0 && newIdx < arg.values.length) {
    arg.idx = newIdx;
  }

  return true;
}

// Helper function used to handle next/previous when the loop function is 'modulo'
function deltaModulo(arg, increment) {
  arg.idx = (arg.values.length + arg.idx + increment) % arg.values.length;
  return true;
}

// Helper function used to handle next/previous when the loop function is 'none'
function deltaNone(arg, increment) {
  var newIdx = arg.idx + increment;

  if (newIdx >= arg.values.length) {
    newIdx = arg.values.length - 1;
  }

  if (newIdx < 0) {
    newIdx = 0;
  }

  if (arg.idx !== newIdx) {
    arg.idx = newIdx;
    return true;
  }

  return false;
}

// QueryDataModel class definition
export default class QueryDataModel {

  constructor(jsonData, basepath) {
    this.originalData = jsonData;
    this.basepath = basepath; // Needed for cloning
    queryDataModelCounter += 1;
    this.id = `QueryDataModel_${queryDataModelCounter} :`;
    this.args = {};
    this.externalArgs = {};
    this.dataCount = {};
    this.categories = {};
    this.requests = [];
    this.keepAnimating = false;
    this.animationTimerId = 0;
    this.mouseListener = null;
    this.dataMetadata = {};
    this.lazyFetchRequest = null;

    this.playNext = () => {
      if (this.keepAnimating) {
        let changeDetected = false;
        this.lastPlay = +(new Date());

        // Move all flagged arg to next()
        Object.keys(this.args).forEach((argName) => {
          if (this.args[argName].anime) {
            changeDetected = this.next(argName) || changeDetected;
          }
        });

        // Keep moving if change detected
        if (changeDetected) {
          // Get new data
          this.lazyFetchData(); // FIXME may need a category
        } else {
          // Auto stop as nothing change
          this.keepAnimating = false;
          this.emit('state.change.play', {
            instance: this,
          });
        }
      } else {
        this.emit('state.change.play', {
          instance: this,
        });
      }
    };

    const processRequest = (request) => {
      var dataToBroadcast = {},
        count = request.urls.length,
        hasPending = false,
        hasError = false;

      if (this.animationTimerId !== 0) {
        clearTimeout(this.animationTimerId);
        this.animationTimerId = 0;
      }

      while (count) {
        count -= 1;
        const item = request.urls[count];
        dataToBroadcast[item.key] = dataManager.get(item.url);
        if (dataToBroadcast[item.key]) {
          hasPending = hasPending || dataToBroadcast[item.key].pending;
        } else {
          hasError = true;
        }
      }

      if (hasPending) {
        // put the request back in the queue
        setImmediate(() => {
          this.requests.push(request);
        });
      } else if (!hasError) {
        // We are good to go
        // Broadcast data to the category
        this.emit(request.category, dataToBroadcast);

        // Trigger new fetch data if any lazyFetchData is pending
        if (this.requests.length === 0 && this.lazyFetchRequest) {
          this.fetchData(this.lazyFetchRequest);
          this.lazyFetchRequest = null;
        }
      }

      // Handle animation if any
      if (this.keepAnimating) {
        const ts = +(new Date());
        this.animationTimerId = setTimeout(this.playNext, (ts - this.lastPlay > this.deltaT) ? 0 : this.deltaT);
      }
    };

    const dataHandler = (data, envelope) => {
      this.dataCount[envelope.topic] += 1;

      // Pre-decode image urls
      if (data.url && data.type === 'blob' && data.data.type.indexOf('image') !== -1 && data.image === undefined) {
        data.image = new Image();
        data.image.src = data.url;
      }

      if (data.error) {
        this.emit('error', envelope);
        return;
        // console.error('Error when fetching ' + envelope.topic);
      }

      // All fetched request are complete
      const minValue = min(this.dataCount),
        maxValue = max(this.dataCount),
        dataSize = size(this.dataCount);

      if (minValue === maxValue && ((dataSize === 1) ? (minValue === 0) : true)) {
        // Handling requests after any re-queue
        setImmediate(() => {
          while (this.requests.length) {
            processRequest(this.requests.pop());
          }
        });
      }
    };

    // Flatten args
    Object.keys(jsonData.arguments).forEach((key) => {
      const arg = jsonData.arguments[key];
      this.args[key] = {
        label: arg.label ? arg.label : key,
        idx: arg.default ? arg.default : 0,
        direction: 1,
        anime: false,
        values: arg.values,
        ui: arg.ui ? arg.ui : 'list',
        delta: arg.loop ?
          (arg.loop === 'reverse' ?
            deltaReverse : (arg.loop === 'modulo' ? deltaModulo : deltaNone)) : deltaNone,
      };
    });

    // Register all data urls
    jsonData.data.forEach((dataEntry) => {
      var dataId = this.id + dataEntry.name;

      // Register data metadata if any
      this.dataMetadata[dataEntry.name] = dataEntry.metadata || {};

      // Fill categories with dataIds
      (dataEntry.categories || [DEFAULT_KEY_NAME]).forEach((category) => {
        if (hasOwn(this.categories, category)) {
          this.categories[category].push(dataId);
        } else {
          this.categories[category] = [dataId];
        }
      });

      // Register data handler + listener
      dataManager.registerURL(dataId, (dataEntry.absolute ? '' : basepath) + dataEntry.pattern, dataEntry.type, dataEntry.mimeType);
      dataManager.on(dataId, dataHandler);
      this.dataCount[dataId] = 0;
    });

    // Data Exploration handling
    this.exploreState = {
      order: jsonData.arguments_order.map(f => f).reverse(), // Clone
      idxs: jsonData.arguments_order.map(i => 0), // Reset index
      sizes: jsonData.arguments_order.map(f => this.getSize(f)).reverse(), // Get Size
      onDataReady: true,
      animate: false,
    };

    this.explorationSubscription = this.onDataChange(() => {
      if (this.exploreState.animate && this.exploreState.onDataReady) {
        setImmediate(_ => this.nextExploration());
      }
    });
  }

  getDataMetaData(dataName) {
    return this.dataMetadata[dataName];
  }

  // Return the current set of arguments values
  getQuery() {
    var query = {};

    Object.keys(this.args).forEach((key) => {
      const arg = this.args[key];
      query[key] = arg.values[arg.idx];
    });

    // Add external args to the query too
    Object.keys(this.externalArgs).forEach((eKey) => {
      query[eKey] = this.externalArgs[eKey];
    });

    return query;
  }

  // Fetch data for a given category or _ if none provided
  fetchData(category = DEFAULT_KEY_NAME) {
    var dataToFetch = [],
      query = this.getQuery(),
      request = {
        urls: [],
      };

    // fill the data to fetch
    if (category.name) {
      request.category = category.name;
      category.categories.forEach((cat) => {
        if (this.categories[cat]) {
          dataToFetch = dataToFetch.concat(this.categories[cat]);
        }
      });
    } else if (this.categories[category]) {
      request.category = category;
      dataToFetch = dataToFetch.concat(this.categories[category]);
    }

    // Decrease the count and record the category request + trigger fetch
    if (dataToFetch.length) {
      this.requests.push(request);
    }

    dataToFetch.forEach((dataId) => {
      this.dataCount[dataId] -= 1;
      request.urls.push({
        key: dataId.slice(this.id.length),
        url: dataManager.fetch(dataId, query),
      });
    });
  }

  lazyFetchData(category = DEFAULT_KEY_NAME) {
    if (this.lazyFetchRequest || this.requests.length > 0) {
      this.lazyFetchRequest = category;
    } else {
      this.fetchData(category);
    }
  }


  // Got to the first value of a given attribute and return true if data has changed
  first(attributeName) {
    var arg = this.args[attributeName];

    if (arg && arg.idx !== 0) {
      arg.idx = 0;
      this.emit('state.change.first', {
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }

    return false;
  }

  // Got to the last value of a given attribute and return true if data has changed
  last(attributeName) {
    var arg = this.args[attributeName],
      last = arg.values.length - 1;

    if (arg && arg.idx !== last) {
      arg.idx = last;
      this.emit('state.change.last', {
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }

    return false;
  }

  // Got to the next value of a given attribute and return true if data has changed
  next(attributeName) {
    var arg = this.args[attributeName];
    if (arg && arg.delta(arg, +1)) {
      this.emit('state.change.next', {
        delta: 1,
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }
    return false;
  }

  // Got to the previous value of a given attribute and return true if data has changed
  previous(attributeName) {
    var arg = this.args[attributeName];
    if (arg && arg.delta(arg, -1)) {
      this.emit('state.change.previous', {
        delta: -1,
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }
    return false;
  }

  // Set a value to an argument (must be in values) and return true if data has changed
  // If argument is not in the argument list. This will be added inside the external argument list.
  setValue(attributeName, value) {
    var arg = this.args[attributeName],
      newIdx = arg ? arg.values.indexOf(value) : 0;

    if (arg && newIdx !== -1 && newIdx !== arg.idx) {
      arg.idx = newIdx;
      this.emit('state.change.value', {
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }

    if (arg === undefined && this.externalArgs[attributeName] !== value) {
      this.externalArgs[attributeName] = value;
      this.emit('state.change.value', {
        value,
        name: attributeName,
        external: true,
        instance: this,
      });
      return true;
    }

    return false;
  }

  // Set a new index to an argument (must be in values range) and return true if data has changed
  setIndex(attributeName, idx) {
    var arg = this.args[attributeName];

    if (arg && idx > -1 && idx < arg.values.length && arg.idx !== idx) {
      arg.idx = idx;
      this.emit('state.change.idx', {
        value: arg.values[arg.idx],
        idx: arg.idx,
        name: attributeName,
        instance: this,
      });
      return true;
    }

    return false;
  }

  // Return the argument value or null if the argument was not found
  // If argument is not in the argument list.
  // We will also search inside the external argument list.
  getValue(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.values[arg.idx] : this.externalArgs[attributeName];
  }

  // Return the argument values list or null if the argument was not found
  getValues(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.values : null;
  }

  // Return the argument index or null if the argument was not found
  getIndex(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.idx : null;
  }

  // Return the argument index or null if the argument was not found
  getUiType(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.ui : null;
  }

  // Return the argument size or null if the argument was not found
  getSize(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.values.length : null;
  }

  // Return the argument label or null if the argument was not found
  label(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.label : null;
  }

  // Return the argument animation flag or false if the argument was not found
  getAnimationFlag(attributeName) {
    var arg = this.args[attributeName];
    return arg ? arg.anime : false;
  }

  // Set the argument animation flag and return true if the value changed
  setAnimationFlag(attributeName, state) {
    var arg = this.args[attributeName];

    if (arg && arg.anime !== state) {
      arg.anime = state;
      this.emit('state.change.animation', {
        animation: arg.anim,
        name: arg.name,
        instance: this,
      });
      return true;
    }

    return false;
  }

  // Toggle the argument animation flag state and return the current state or
  // null if not found.
  toggleAnimationFlag(attributeName) {
    var arg = this.args[attributeName];

    if (arg) {
      arg.anime = !arg.anime;
      this.emit('state.change.animation', {
        animation: arg.anim,
        name: arg.name,
        instance: this,
      });
      return arg.anime;
    }

    return null;
  }

  // Check if one of the argument is currently active for the animation
  hasAnimationFlag() {
    let flag = false;
    Object.keys(this.args).forEach((key) => {
      if (this.args[key].anime) {
        flag = true;
      }
    });
    return flag;
  }

  // Return true if an animation is currently running
  isAnimating() {
    return this.keepAnimating;
  }

  // Start/Stop an animation
  animate(start, deltaT = 500) {
    // Update deltaT
    this.deltaT = deltaT;

    if (start !== this.keepAnimating) {
      this.keepAnimating = start;
      this.playNext();
    }
  }

  // Mouse handler if any base on the binding
  getMouseListener() {
    if (this.mouseListener) {
      return this.mouseListener;
    }

    // Record last action time
    this.lastTime = {};
    this.newMouseTimeout = 250;

    // We need to create a mouse listener
    const self = this,
      actions = {};

    // Create an action map
    Object.keys(this.originalData.arguments).forEach((key) => {
      const value = this.originalData.arguments[key];
      if (value.bind && value.bind.mouse) {
        Object.keys(value.bind.mouse).forEach((action) => {
          const obj = omit(value.bind.mouse[action]);
          obj.name = key;
          obj.lastCoord = 0;
          if (obj.orientation === undefined) {
            obj.orientation = 1;
          }
          if (actions[action]) {
            actions[action].push(obj);
          } else {
            actions[action] = [obj];
          }
        });
      }
    });

    /* eslint-disable complexity */
    function processEvent(event, envelope) {
      var array = actions[event.topic],
        time = now(),
        newEvent = (self.lastTime[event.topic] + self.newMouseTimeout < time),
        count = array.length,
        changeDetected = false,
        eventHandled = false;

      // Check all associated actions
      while (count) {
        count -= 1;
        const item = array[count],
          deltaName = (item.coordinate === 0) ? 'deltaX' : 'deltaY';

        if (newEvent) {
          item.lastCoord = 0;
        }

        /* eslint-disable no-bitwise */
        if (item.modifier & event.modifier || item.modifier === event.modifier) {
          eventHandled = true;
          const delta = event[deltaName] - item.lastCoord;
          self.lastTime[event.topic] = time;

          if (Math.abs(delta) > item.step) {
            item.lastCoord = Number(event[deltaName]);

            if (item.orientation * delta > 0) {
              changeDetected = self.next(item.name) || changeDetected;
            } else {
              changeDetected = self.previous(item.name) || changeDetected;
            }
          }
        }
      }

      if (changeDetected) {
        self.lazyFetchData(); // FIXME category
      }

      return eventHandled;
    }
    /* eslint-enable complexity */

    this.mouseListener = {};
    Object.keys(actions).forEach((actionName) => {
      this.mouseListener[actionName] = processEvent;
      this.lastTime[actionName] = now();
    });

    return this.mouseListener;
  }

  // Event helpers
  onStateChange(callback) {
    return this.on('state.change.*', callback);
  }

  onDataChange(callback) {
    return this.on(DEFAULT_KEY_NAME, callback);
  }

  // Return a new instance based on the same metadata and basepath
  clone() {
    return new QueryDataModel(this.originalData, this.basepath);
  }

  destroy() {
    this.off();

    this.explorationSubscription.unsubscribe();
    this.explorationSubscription = null;
  }

  // Data exploration -----------------------------------------------------------

  exploreQuery(start = true, fromBeguining = true, onDataReady = true) {
    if (fromBeguining) {
      this.exploreState.idxs = this.exploreState.order.map(i => 0);
    } else {
      this.exploreState.idxs = this.exploreState.order.map(field => this.getIndex(field));
    }
    this.exploreState.onDataReady = onDataReady;
    this.exploreState.animate = start;

    // Start animation
    if (this.exploreState.animate) {
      this.nextExploration();
    }

    this.emit('state.change.exploration', {
      exploration: this.exploreState,
      instance: this,
    });
  }

  nextExploration() {
    if (this.exploreState.animate) {
      // Update internal query
      this.exploreState.order.forEach((f, i) => {
        this.setIndex(f, this.exploreState.idxs[i]);
      });

      // Move to next step
      const idxs = this.exploreState.idxs,
        sizes = this.exploreState.sizes;
      let count = idxs.length;

      // May overshoot
      idxs[count - 1] += 1;

      // Handle overshoot
      while (count) {
        count -= 1;
        if (idxs[count] < sizes[count]) {
          // We are good
          /* eslint-disable no-continue */
          continue;
          /* eslint-enable no-continue */
        } else if (count > 0) {
          // We need to move the index back up
          idxs[count] = 0;
          idxs[count - 1] += 1;
        } else {
          this.exploreState.animate = false;
          this.emit('state.change.exploration', {
            exploration: this.exploreState,
            instance: this,
          });
          return this.exploreState.animate; // We are done
        }
      }

      // Trigger the fetchData
      this.lazyFetchData();
    }
    return this.exploreState.animate;
  }

  /* eslint-disable class-methods-use-this */
  setCacheSize(sizeBeforeGC) {
    dataManager.cacheSize = sizeBeforeGC;
  }

  getCacheSize() {
    return dataManager.cacheSize;
  }

  getMemoryUsage() {
    return dataManager.cacheData.size;
  }

  link(queryDataModel, args = null, fetch = false) {
    return queryDataModel.onStateChange((data, envelope) => {
      if (data.name !== undefined && data.value !== undefined) {
        if (args === null || args.indexOf(data.name) !== -1) {
          if (this.setValue(data.name, data.value) && fetch) {
            this.lazyFetchData();
          }
        }
      }
    });
  }
}

Monologue.mixInto(QueryDataModel);
