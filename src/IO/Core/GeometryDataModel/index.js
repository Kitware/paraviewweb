/* global window */

import Monologue from 'monologue.js';
import DataManager from '../DataManager';

const
  dataManager = new DataManager(),
  OBJECT_READY_TOPIC = 'object-ready';

var geometryDataModelCounter = 0;

export default class GeometryDataModel {

  constructor(basepath) {
    geometryDataModelCounter += 1;

    this.basepath = basepath; // Needed for cloning
    this.id = ['GeometryDataModel', geometryDataModelCounter].join('_');
    this.coloByMapping = {};
    this.currentScene = null;
    this.sceneData = {};
    this.dataMapping = {};

    dataManager.on(this.id, (data, envelope) => {
      const url = data.requestedURL,
        dataDescription = this.dataMapping[url];

      if (dataDescription) {
        const obj = this.sceneData[dataDescription.name];
        let objectComplete = true;

        this.sceneData[dataDescription.name][dataDescription.field] = new window[dataDescription.type](data.data);

        Object.keys(obj).forEach((key) => {
          if (obj[key] === null) {
            objectComplete = false;
          }
        });
        if (objectComplete) {
          this.geometryReady(obj);
        }
      }
    });
  }

  onGeometryReady(callback) {
    return this.on(OBJECT_READY_TOPIC, callback);
  }

  geometryReady(obj) {
    this.emit(OBJECT_READY_TOPIC, obj);
  }

  colorGeometryBy(objectName, fieldName) {
    var changeDetected = false;
    if (fieldName) {
      changeDetected = (this.coloByMapping[objectName] !== fieldName);
      this.coloByMapping[objectName] = fieldName;
    } else {
      delete this.coloByMapping[objectName];
    }

    if (changeDetected) {
      this.loadScene(this.currentScene);
    }
  }

  loadScene(scene) {
    this.currentScene = scene;
    if (scene) {
      // Reset data
      this.dataMapping = {};
      this.sceneData = {};
      const sceneData = this.sceneData;

      // Fill data with expected
      scene.forEach((obj) => {
        const name = obj.name,
          urls = [];
        let url = null;

        // Init structure
        sceneData[name] = {
          name,
          points: null,
          index: null,
        };

        // Register urls
        url = this.basepath + obj.points;
        this.dataMapping[url] = {
          name,
          field: 'points',
          type: obj.points.split('.').slice(-1)[0],
        };
        urls.push(url);


        url = this.basepath + obj.index;
        this.dataMapping[url] = {
          name,
          field: 'index',
          type: obj.index.split('.').slice(-1)[0],
        };
        urls.push(url);

        if (this.coloByMapping[name]) {
          sceneData[name].field = null;
          sceneData[name].fieldName = this.coloByMapping[name];

          url = this.basepath + obj.fields[this.coloByMapping[name]];
          this.dataMapping[url] = {
            name,
            field: 'field',
            type: obj.fields[this.coloByMapping[name]].split('.').slice(-1)[0],
          };
          urls.push(url);
        }

        // Make the requests
        urls.forEach((urlToFecth) => {
          dataManager.fetchURL(urlToFecth, 'array', null, this.id);
        });
      });
    }
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(GeometryDataModel);
