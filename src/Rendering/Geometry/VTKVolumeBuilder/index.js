import Monologue from 'monologue.js';

// Required now with vtk.js 18+
import 'vtk.js/Sources/Rendering/OpenGL/Profiles/All';

/* eslint-disable import/no-named-as-default */
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

const IMAGE_READY_TOPIC = 'image-ready';
const DEFAULT_ARRAY_NAME = 'Scalars';

export default class VTKVolumeBuilder {
  constructor(lutMgr, imageDataModel, queryDataModel) {
    this.lookupTableManager = lutMgr;
    this.imageDataModel = imageDataModel;
    this.queryDataModel = queryDataModel;
    this.pipeline = {};
    this.initActions = [];

    // Handle data fetching
    this.queryDataModel.onDataChange((data, envelope) => {
      if (data.scene) {
        this.imageDataModel.loadScene(data.scene.data);
      }
      if (data.clusters) {
        this.imageDataModel.loadClusters(this.queryDataModel, data.clusters);
      }
    });

    // Handle LookupTable change
    this.pipeline.range = [0, 255];
    if (
      this.queryDataModel.originalData.metadata &&
      this.queryDataModel.originalData.metadata.piecewise
    ) {
      const pwArray = this.queryDataModel.originalData.metadata.piecewise;
      this.pipeline.range[1] = pwArray[pwArray.length - 1][0];
    }
    const arrayNames = Object.keys(
      this.queryDataModel.originalData.LookupTables || {}
    );
    this.arrayName = arrayNames.length ? arrayNames[0] : DEFAULT_ARRAY_NAME;
    this.lookupTableManager.addFields(
      { [this.arrayName]: this.pipeline.range },
      this.queryDataModel.originalData.LookupTables
    );
    this.lookupTableManager.updateActiveLookupTable(this.arrayName);

    this.lookupTableManager.onChange((data, envelope) => {
      this.updateColoring(data.change, data.lut);
    });

    // Scene management
    // VTK renderWindow/renderer
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);

    const color =
      this.queryDataModel.originalData.metadata &&
      this.queryDataModel.originalData.metadata.backgroundColor
        ? this.queryDataModel.originalData.metadata.backgroundColor
        : '#000000';
    if (color.length === 7) {
      const bgColor = [
        color.slice(1, 3),
        color.slice(3, 5),
        color.slice(5, 7),
      ].map((v) => parseInt(v, 16) / 255);
      this.renderer.setBackground(bgColor);
    }

    this.imageBuilderSubscription = this.imageDataModel.onGeometryReady(
      (data, envelope) => {
        this.updateGeometry(data);
      }
    );
  }

  destroy() {
    // Remove listener
    if (this.imageBuilderSubscription) {
      this.imageBuilderSubscription.unsubscribe();
      this.imageBuilderSubscription = null;
    }
  }

  configureRenderer(canvas) {
    // OpenGlRenderWindow
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.openGlRenderWindow.setCanvas(canvas);
    this.renderWindow.addView(this.openGlRenderWindow);

    // Interactor
    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openGlRenderWindow);
    this.interactor.initialize();
    this.interactor.bindEvents(canvas);

    // Create a render() method that can be called from anywhere
    this.render = this.renderWindow.render;

    this.queryDataModel.fetchData();
  }

  updateColoring() {
    const lookupTable = this.getLookupTable();
    this.pipeline.ctfun.removeAllPoints();
    lookupTable.controlPoints.forEach(({ x, r, g, b }) => {
      this.pipeline.ctfun.addRGBPoint(x, r, g, b);
    });
    this.pipeline.ctfun.setMappingRange(...lookupTable.getScalarRange());
    this.renderWindow.render();
  }

  getLookupTable() {
    return this.lookupTableManager.getLookupTable(this.arrayName);
  }

  getColorFunction() {
    return this.pipeline.ctfun;
  }

  getPiecewiseFunction() {
    return this.pipeline.ofun;
  }

  getDataRange() {
    return this.pipeline.range;
  }

  getImageData() {
    return this.pipeline.source;
  }

  getActor() {
    return this.pipeline.actor;
  }

  getMapper() {
    return this.pipeline.mapper;
  }

  getActiveCamera() {
    return this.renderer.getActiveCamera();
  }

  updateGeometry(imageData) {
    let firstTime = false;
    if (!this.pipeline.actor) {
      firstTime = true;

      this.pipeline.actor = vtkVolume.newInstance();
      this.pipeline.mapper = vtkVolumeMapper.newInstance({
        sampleDistance: 0.7,
      });
      this.pipeline.actor.setMapper(this.pipeline.mapper);

      this.pipeline.ctfun = vtkColorTransferFunction.newInstance();
      this.pipeline.ctfun.addRGBPoint(this.pipeline.range[0], 85 / 255.0, 0, 0);
      this.pipeline.ctfun.addRGBPoint(
        0.37 * this.pipeline.range[1],
        1.0,
        1.0,
        1.0
      );
      this.pipeline.ctfun.addRGBPoint(
        0.88 * this.pipeline.range[1],
        0.66,
        0.66,
        0.5
      );
      this.pipeline.ctfun.addRGBPoint(this.pipeline.range[1], 0.3, 1.0, 0.5);

      this.pipeline.ofun = vtkPiecewiseFunction.newInstance();
      this.pipeline.ofun.addPoint(this.pipeline.range[0], 0.0);
      this.pipeline.ofun.addPoint(this.pipeline.range[1], 1.0);

      this.pipeline.actor
        .getProperty()
        .setRGBTransferFunction(0, this.pipeline.ctfun);
      this.pipeline.actor.getProperty().setScalarOpacity(0, this.pipeline.ofun);
      this.pipeline.actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
      this.pipeline.actor.getProperty().setInterpolationTypeToLinear();

      // Add shadow
      this.pipeline.actor.getProperty().setGradientOpacityMinimumValue(0, 15);
      this.pipeline.actor
        .getProperty()
        .setGradientOpacityMinimumOpacity(0, 0.0);
      this.pipeline.actor.getProperty().setGradientOpacityMaximumValue(0, 100);
      this.pipeline.actor
        .getProperty()
        .setGradientOpacityMaximumOpacity(0, 1.0);
      this.pipeline.actor.getProperty().setShade(true);
      this.pipeline.actor.getProperty().setAmbient(0.2);
      this.pipeline.actor.getProperty().setDiffuse(0.7);
      this.pipeline.actor.getProperty().setSpecular(0.3);
      this.pipeline.actor.getProperty().setSpecularPower(8.0);
    }

    if (this.pipeline.source !== imageData) {
      this.pipeline.source = imageData;
      this.pipeline.range = imageData.getPointData().getScalars().getRange();
      this.pipeline.mapper.setInputData(this.pipeline.source);

      this.emit(IMAGE_READY_TOPIC, firstTime);
    }

    if (firstTime) {
      this.renderer.addVolume(this.pipeline.actor);
      this.renderer.resetCamera();
      this.renderer.updateLightsGeometryToFollowCamera();
      this.initActions.forEach((cb) => cb());
    }

    this.renderWindow.render();
  }

  getRenderer() {
    return this.renderer;
  }

  getRenderWindow() {
    return this.renderWindow;
  }

  resetCamera() {
    this.renderer.resetCamera();
    this.renderWindow.render();
  }

  addInitializationAction(initCallback) {
    this.initActions.push(initCallback);
  }

  clearInitializationActions() {
    this.initActions = [];
  }

  render() {
    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
  }

  updateSize(width, height) {
    this.openGlRenderWindow.setSize(width, height);
    this.renderWindow.render();
  }

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(VTKVolumeBuilder);
