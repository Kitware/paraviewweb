/* eslint-disable import/no-named-as-default */
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

export default class VTKVolumeBuilder {

  constructor(lutMgr, imageDataModel, queryDataModel) {
    this.lookupTableManager = lutMgr;
    this.imageDataModel = imageDataModel;
    this.queryDataModel = queryDataModel;
    this.pipeline = {};

    // Handle data fetching
    this.queryDataModel.onDataChange((data, envelope) => {
      if (data.scene) {
        this.imageDataModel.loadScene(data.scene.data);
      }
    });

    // Handle LookupTable change
    // FIXME ?
    this.lookupTableManager.addFields({ Scalars: [0, 255] });
    this.lookupTableManager.updateActiveLookupTable('Scalars');

    // this.lookupTableManager.addFields(this.queryDataModel.originalData.Geometry.ranges,
    //   this.queryDataModel.originalData.LookupTables);
    this.lookupTableManager.onChange((data, envelope) => {
      this.updateColoring(data.change, data.lut);
    });

    // Scene management
    // VTK renderWindow/renderer
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);
    this.renderer.setBackground(0.5, 0.5, 0.5);

    this.imageBuilderSubscription = this.imageDataModel.onGeometryReady((data, envelope) => {
      this.updateGeometry(data);
    });
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

  updateColoring(whatChanged, lookupTable) {
    // FIXME
    console.log('Update coloring', this);
    // Object.keys(this.meshMap).forEach((name) => {
    //   const renderInfo = this.meshMap[name];
    //   if (renderInfo.colorArrayName === lookupTable.name) {
    //     renderInfo.mapper.setScalarRange(...lookupTable.getScalarRange());
    //     if (renderInfo.fieldValue !== undefined) {
    //       const c = lookupTable.getColor(renderInfo.fieldValue);
    //       renderInfo.actor.getProperty().setDiffuseColor(c[0], c[1], c[2]);
    //     }
    //     if (renderInfo.mapper.getLookupTable().removeAllPoints) {
    //       renderInfo.mapper.getLookupTable().removeAllPoints();
    //       lookupTable.controlPoints.forEach(({ x, r, g, b }) => {
    //         renderInfo.mapper.getLookupTable().addRGBPoint(x, r, g, b);
    //       });
    //     }
    //     this.renderWindow.render();
    //   }
    // });
  }

  updateGeometry(imageData) {
    console.log('update geometry');
    let firstTime = false;
    if (!this.pipeline.actor) {
      firstTime = true;

      this.pipeline.actor = vtkVolume.newInstance();
      this.pipeline.mapper = vtkVolumeMapper.newInstance();
      this.pipeline.mapper.setSampleDistance(0.7);
      this.pipeline.actor.setMapper(this.pipeline.mapper);

      this.pipeline.ctfun = vtkColorTransferFunction.newInstance();
      this.pipeline.ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
      this.pipeline.ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
      this.pipeline.ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
      this.pipeline.ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);

      this.pipeline.ofun = vtkPiecewiseFunction.newInstance();
      this.pipeline.ofun.addPoint(0.0, 0.0);
      this.pipeline.ofun.addPoint(255.0, 1.0);

      this.pipeline.actor.getProperty().setRGBTransferFunction(0, this.pipeline.ctfun);
      this.pipeline.actor.getProperty().setScalarOpacity(0, this.pipeline.ofun);
      this.pipeline.actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
      this.pipeline.actor.getProperty().setInterpolationTypeToLinear();
      console.log('pipeline creation');
    }

    if (this.pipeline.source !== imageData) {
      console.log('link data source');
      this.pipeline.source = imageData;
      this.pipeline.mapper.setInputData(this.pipeline.source);
    }

    if (firstTime) {
      console.log('add volume', this.pipeline.actor);
      this.renderer.addVolume(this.pipeline.actor);
      console.log('reset camera');
      this.renderer.resetCamera();
    }

    this.renderWindow.render();
  }

  resetCamera() {
    this.renderer.resetCamera();
    this.renderWindow.render();
  }

  updateSize(width, height) {
    this.openGlRenderWindow.setSize(width, height);
    this.renderWindow.render();
  }

}
