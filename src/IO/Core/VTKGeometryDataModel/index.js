import Monologue from 'monologue.js';
import DataManager from 'paraviewweb/src/IO/Core/DataManager';

let dataManager = new DataManager();
const OBJECT_READY_TOPIC = 'object-ready';

let geometryDataModelCounter = 0;

function getType(url) {
  return url.split('.').slice(-1)[0];
}

export default class VTKGeometryDataModel {
  constructor(basepath) {
    geometryDataModelCounter += 1;

    this.basepath = basepath; // Needed for cloning
    this.id = ['VTKGeometryDataModel', geometryDataModelCounter].join('_');
    this.colorByMapping = {};
    this.currentScene = null;
    this.sceneData = {};
    this.dataMapping = {};

    this.dataManagerListener = (data, envelope) => {
      const url = data.requestedURL;
      const dataDescription = this.dataMapping[url];

      if (dataDescription) {
        const obj = this.sceneData[dataDescription.name];
        let objectComplete = true;

        this.sceneData[dataDescription.name][
          dataDescription.field
        ] = new window[dataDescription.type](data.data);

        Object.keys(obj).forEach((key) => {
          if (obj[key] === undefined) {
            objectComplete = false;
          }
        });
        if (objectComplete) {
          this.geometryReady(obj);
        }
      }
    };
    this.dataManagerSubscription = dataManager.on(
      this.id,
      this.dataManagerListener
    );
  }

  setDataManager(dm) {
    this.dataManagerSubscription.unsubscribe();
    dataManager = dm;
    this.dataManagerSubscription = dataManager.on(
      this.id,
      this.dataManagerListener
    );
  }

  onGeometryReady(callback) {
    return this.on(OBJECT_READY_TOPIC, callback);
  }

  geometryReady(obj) {
    this.emit(OBJECT_READY_TOPIC, obj);
  }

  loadField(objectName, fieldName) {
    let changeDetected = false;
    if (fieldName) {
      changeDetected = this.colorByMapping[objectName] !== fieldName;
      this.colorByMapping[objectName] = fieldName;
    } else {
      delete this.colorByMapping[objectName];
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
      scene.forEach((polydata) => {
        const name = polydata.name;
        const urls = [];
        let url = null;

        // Init structure
        sceneData[name] = {
          name,
          cells: [],
          points: undefined,
          sha: {},
        };

        // Get points
        url = this.basepath + polydata.points;
        this.dataMapping[url] = {
          name,
          field: 'points',
          type: getType(url),
        };
        sceneData[name].sha.points = url;
        urls.push(url);

        // Get cells
        Object.keys(polydata.cells).forEach((cellType) => {
          url = this.basepath + polydata.cells[cellType];
          sceneData[name][cellType] = undefined;
          sceneData[name].cells.push(cellType);
          this.dataMapping[url] = {
            name,
            field: cellType,
            type: getType(url),
          };
          sceneData[name].sha[cellType] = url;
          urls.push(url);
        });

        // Get fields
        if (this.colorByMapping[name]) {
          sceneData[name].field =
            polydata.fields[this.colorByMapping[name]].constant;
          sceneData[name].fieldName = this.colorByMapping[name];
          sceneData[name].fieldLocation =
            polydata.fields[this.colorByMapping[name]].location;

          if (sceneData[name].field === undefined) {
            url =
              this.basepath + polydata.fields[this.colorByMapping[name]].array;
            this.dataMapping[url] = {
              name,
              field: 'field',
              meta: polydata.fields[this.colorByMapping[name]],
              type: getType(url),
            };
            sceneData[name].sha.field = url;
            urls.push(url);
          }
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
Monologue.mixInto(VTKGeometryDataModel);
