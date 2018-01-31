import 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

import pako from 'pako';

import vtk from 'vtk.js/Sources/vtk';
import Monologue from 'monologue.js';
import DataManager from '../DataManager';

let dataManager = new DataManager();
const OBJECT_READY_TOPIC = 'object-ready';

var imageDataModelCounter = 0;

export default class VTKImageDataModel {
  constructor(basepath) {
    imageDataModelCounter += 1;

    this.dataMapping = {};
    this.fetchGzip = true;
    this.basepath = basepath; // Needed for cloning
    this.id = ['VTKImageDataModel', imageDataModelCounter].join('_');
    this.colorByMapping = {};
    this.currentImageData = null;

    this.dataManagerListener = (data, envelope) => {
      const url = data.requestedURL;
      const dataDescription = this.dataMapping[url];

      if (dataDescription && this.currentImageData) {
        delete dataDescription.ref;
        let values = null;

        if (this.fetchGzip) {
          values = new window[dataDescription.dataType](
            pako.inflate(new Uint8Array(data.data)).buffer
          );
        } else {
          values = new window[dataDescription.dataType](data.data);
        }

        const dataArray = vtkDataArray.newInstance(
          Object.assign({}, dataDescription, { values })
        );
        this.currentImageData
          .get(dataDescription.location)
          [dataDescription.location].setScalars(dataArray);
        this.currentImageData.modified();

        if (
          !Object.keys(this.dataMapping)
            .map((key) => this.dataMapping[key].ref)
            .find((i) => !!i)
        ) {
          this.geometryReady(this.currentImageData);
        }
      } else {
        console.log('skip no vtkImageData');
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
    this.geometryReady(this.currentImageData);
    // NoOp
  }

  setFetchGzip(enable = true) {
    this.fetchGzip = !!enable;
  }

  loadScene(imageDataJSON) {
    if (imageDataJSON.processed) {
      if (this.currentImageData !== imageDataJSON.processed) {
        this.currentImageData = imageDataJSON.processed;
        this.geometryReady(this.currentImageData);
      }
    } else {
      const urls = [];
      this.dataMapping = {};
      if (imageDataJSON) {
        ['pointData', 'cellData'].forEach((location) => {
          if (
            imageDataJSON[location] &&
            imageDataJSON[location].arrays &&
            imageDataJSON[location].arrays.length
          ) {
            imageDataJSON[location].arrays.forEach((dataArray) => {
              let url = `${this.basepath}${dataArray.data.ref.basepath}/${
                dataArray.data.ref.id
              }`;
              if (this.fetchGzip) {
                url += '.gz';
              }
              urls.push(url);
              this.dataMapping[url] = Object.assign(
                { location, url },
                dataArray.data
              );
            });

            // Clear array container
            imageDataJSON[location].arrays = [];
          }
        });

        // Create image data
        this.currentImageData = vtk(imageDataJSON);
        imageDataJSON.processed = this.currentImageData;

        // Make the requests
        urls.forEach((urlToFecth) => {
          dataManager.fetchURL(urlToFecth, 'array', null, this.id);
        });
      }
    }
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(VTKImageDataModel);
