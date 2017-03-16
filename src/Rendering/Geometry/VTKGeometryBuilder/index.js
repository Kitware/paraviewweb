/* eslint-disable import/no-named-as-default */
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

const EMPTY_CELL_ARRAY = new Uint32Array(0);

export default class VTKGeometryBuilder {

  constructor(lutMgr, geometryDataModel, pipelineModel, queryDataModel) {
    this.meshMap = {};

    this.firstSceneLoad = true;
    this.lookupTableManager = lutMgr;
    this.geometryDataModel = geometryDataModel;
    this.pipelineModel = pipelineModel;
    this.queryDataModel = queryDataModel;
    this.layerMap = this.queryDataModel.originalData.Geometry.layer_map;
    this.fieldMap = this.queryDataModel.originalData.CompositePipeline.fields;

    // Handle pipeline color change
    const updatePipeline = (pipelineQuery, envelope) => {
      var size = pipelineQuery.length;

      for (let i = 0; i < size; i += 2) {
        const objectName = this.layerMap[pipelineQuery[i]],
          fieldName = this.fieldMap[pipelineQuery[i + 1]];
        // if (fieldName !== '_') {
        if (fieldName) {
          this.geometryDataModel.loadField(objectName, fieldName);
          this.updateObjectVisibility(objectName, true);
        } else {
          this.updateObjectVisibility(objectName, false);
        }
      }

      this.queryDataModel.fetchData();
    };
    this.pipelineModel.onChange(updatePipeline);

    // Handle data fetching
    this.queryDataModel.onDataChange((data, envelope) => {
      if (data.scene) {
        this.geometryDataModel.loadScene(data.scene.data);

        if (this.firstSceneLoad) {
          this.firstSceneLoad = false;
          updatePipeline(this.pipelineModel.getPipelineQuery());
        }
      }
    });

    // Handle LookupTable change
    this.lookupTableManager.addFields(this.queryDataModel.originalData.Geometry.ranges,
      this.queryDataModel.originalData.LookupTables);
    this.lookupTableManager.onChange((data, envelope) => {
      this.updateColoring(data.change, data.lut);
    });

    // Scene management
    // VTK renderWindow/renderer
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);

    this.geometryBuilderSubscription = this.geometryDataModel.onGeometryReady((data, envelope) => {
      this.updateGeometry(data);
    });
  }

  destroy() {
    // Remove listener
    if (this.geometryBuilderSubscription) {
      this.geometryBuilderSubscription.unsubscribe();
      this.geometryBuilderSubscription = null;
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
    Object.keys(this.meshMap).forEach((name) => {
      const renderInfo = this.meshMap[name];
      if (renderInfo.colorArrayName === lookupTable.name) {
        renderInfo.mapper.setScalarRange(...lookupTable.getScalarRange());
        if (renderInfo.fieldValue !== undefined) {
          const c = lookupTable.getColor(renderInfo.fieldValue);
          renderInfo.actor.getProperty().setDiffuseColor(c[0], c[1], c[2]);
        }
        if (renderInfo.mapper.getLookupTable().removeAllPoints) {
          renderInfo.mapper.getLookupTable().removeAllPoints();
          lookupTable.controlPoints.forEach(({ x, r, g, b }) => {
            renderInfo.mapper.getLookupTable().addRGBPoint(x, r, g, b);
          });
        }
        this.renderWindow.render();
      }
    });
  }

  updateGeometry(geo) {
    let firstTime = false;
    const lut = this.lookupTableManager.getLookupTable(geo.fieldName);
    if (!(geo.name in this.meshMap)) {
      // Create new Geometry
      firstTime = true;
      const sha = geo.sha;
      const source = vtkPolyData.newInstance();
      const mapper = vtkMapper.newInstance({ interpolateScalarsBeforeMapping: true });
      const actor = vtkActor.newInstance();
      const lookupTable = vtkColorTransferFunction.newInstance();
      mapper.setLookupTable(lookupTable);
      // const lookupTable = mapper.getLookupTable();
      // lookupTable.setHueRange(0.666, 0);

      mapper.setInputData(source);
      actor.setMapper(mapper);

      if (lut) {
        mapper.setScalarRange(...lut.getScalarRange());
        if (lookupTable.removeAllPoints) {
          lookupTable.removeAllPoints();
          lut.controlPoints.forEach(({ x, r, g, b }) => {
            lookupTable.addRGBPoint(x, r, g, b);
          });
        }
      }

      // Register geometry
      this.meshMap[geo.name] = {
        source,
        mapper,
        actor,
        lookupTable,
        sha,
      };

      // Bind data
      source.getPoints().setData(geo.points, 3);
      ['verts', 'lines', 'polys', 'strips'].forEach((cellType) => {
        if (geo.cells.indexOf(cellType) === -1) {
          source.get(cellType)[cellType].setData(EMPTY_CELL_ARRAY);
        } else {
          source.get(cellType)[cellType].setData(geo[cellType]);
        }
      });
      this.renderer.addActor(actor);
      this.renderer.resetCamera();
    } else {
      let changeDetected = false;
      const { source, sha } = this.meshMap[geo.name];
      if (geo.sha.points !== sha.points) {
        source.getPoints().setData(geo.points, 3);
        sha.points = geo.sha.points;
        changeDetected = true;
      }

      ['verts', 'lines', 'polys', 'strips'].forEach((cellType) => {
        if (geo.cells.indexOf(cellType) === -1) {
          if (source.get(cellType)[cellType].getData() !== EMPTY_CELL_ARRAY) {
            source.get(cellType)[cellType].setData(EMPTY_CELL_ARRAY);
            changeDetected = true;
          }
        } else if (geo.sha[cellType] !== sha[cellType]) {
          source.get(cellType)[cellType].setData(geo[cellType]);
          sha[cellType] = geo.sha[cellType];
          changeDetected = true;
        }
      });
      if (changeDetected) {
        source.modified();
      }
    }

    // Handle data field
    this.meshMap[geo.name].colorArrayName = geo.fieldName;
    const { actor, source, sha } = this.meshMap[geo.name];
    if (sha.field !== geo.sha.field || firstTime || Number.isFinite(geo.field)) {
      const fields = {
        POINT_DATA: source.getPointData(),
        CELL_DATA: source.getCellData(),
      };
      Object.keys(fields).forEach(key => fields[key].removeAllArrays());

      if (geo.field !== undefined) {
        const { fieldLocation, fieldName, field } = geo;
        if (Number.isFinite(field)) {
          if (lut) {
            this.meshMap[geo.name].fieldValue = field;
            const c = lut.getColor(field);
            actor.getProperty().setDiffuseColor(c[0], c[1], c[2]);
          }
          // let size = source.getPoints().getNumberOfPoints();
          // if (fieldLocation === 'CELL_DATA') {
          //   size = source.getNumberOfCells();
          // }
          // const values = new Float32Array(size);
          // values.fill(field);
          // const array = vtkDataArray.newInstance({ name: fieldName, values });
          // fields[fieldLocation].setScalars(array);
        } else {
          const array = vtkDataArray.newInstance({ name: fieldName, values: field });
          fields[fieldLocation].setScalars(array);
        }
      }
    }

    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
  }

  updateObjectVisibility(name, visibility) {
    if (this.meshMap[name]) {
      this.meshMap[name].actor.setVisibility(!!visibility);
    }
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
