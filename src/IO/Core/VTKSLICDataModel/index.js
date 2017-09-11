import vtkSLICSource from 'vtk.js/Sources/Filters/Sources/SLICSource';

import Monologue from 'monologue.js';

const OBJECT_READY_TOPIC = 'object-ready';

export default class VTKSLICDataModel {

  constructor() {
    this.slicSource = vtkSLICSource.newInstance();
  }

  onGeometryReady(callback) {
    return this.on(OBJECT_READY_TOPIC, callback);
  }

  geometryReady(obj) {
    this.emit(OBJECT_READY_TOPIC, obj);
  }

  loadClusters(queryDataModel, clusterData) {
    if (clusterData.dataset) {
      if (this.currentImageData !== clusterData.dataset) {
        this.currentImageData = clusterData.dataset;
        this.geometryReady(this.currentImageData);
      }
    } else {
      this.slicSource.set(queryDataModel.originalData.SLIC);
      while (this.slicSource.getNumberOfClusters()) {
        this.slicSource.removeCluster(0);
      }

      const clusters = new Float32Array(clusterData.data);
      const dataSize = clusters.length;
      for (let i = 0; i < dataSize; i += 7) {
        console.log(`(${i / 7}) add cluster center(${clusters[i]}, ${clusters[i + 1]}, ${clusters[i + 2]})`,
          `- const(${clusters[i + 3]}) - slope(${clusters[i + 4]}, ${clusters[i + 5]}, ${clusters[i + 6]})`);
        this.slicSource.addCluster(clusters[i], clusters[i + 1], clusters[i + 2], clusters[i + 3], clusters[i + 4], clusters[i + 5], clusters[i + 6]);
      }
      this.slicSource.update();
      this.currentImageData = clusterData.dataset = this.slicSource.getOutputData();
      this.currentImageData.getPointData().setScalars(this.currentImageData.getPointData().getArray(this.slicSource.getScalarArrayName()));
      this.geometryReady(this.currentImageData);
    }
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(VTKSLICDataModel);
