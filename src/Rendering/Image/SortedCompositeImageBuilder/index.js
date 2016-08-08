import AbstractImageBuilder from '../AbstractImageBuilder';
import CPUCompositor from './sorted-compositor-cpu';
import EqualizerModel from '../../../Common/State/EqualizerState';
import GPUCompositor from './sorted-compositor-gpu';
import ToggleModel from '../../../Common/State/ToggleState';

const
  LUT_NAME = 'VolumeScalar';

export default class SortedCompositeImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(queryDataModel, lookupTableManager) {
    super({ queryDataModel, lookupTableManager, dimensions: queryDataModel.originalData.SortedComposite.dimensions });

    this.dataQuery = {
      name: 'data_fetch',
      categories: [],
    };
    this.metadata = queryDataModel.originalData.SortedComposite;

    // Add Lut
    this.originalRange = [this.metadata.scalars[0], this.metadata.scalars[this.metadata.scalars.length - 1]];
    this.lutTextureData = new Uint8Array(this.metadata.layers * 4);
    lookupTableManager.addFields({ VolumeScalar: [0, 1] }, this.queryDataModel.originalData.LookupTables);
    this.lookupTable = lookupTableManager.getLookupTable(LUT_NAME);
    this.registerSubscription(this.lookupTable.onChange((data, envelope) => {
      for (let idx = 0; idx < this.metadata.layers; idx++) {
        const color = this.lookupTable.getColor(this.metadata.scalars[idx]);

        this.lutTextureData[idx * 4] = color[0] * 255;
        this.lutTextureData[(idx * 4) + 1] = color[1] * 255;
        this.lutTextureData[(idx * 4) + 2] = color[2] * 255;
      }
      this.render();
    }));

    this.compositors = [
      new CPUCompositor(queryDataModel, this, this.lutTextureData, this.metadata.reverseCompositePass),
      new GPUCompositor(queryDataModel, this, this.lutTextureData, this.metadata.reverseCompositePass),
    ];
    this.compositor = this.compositors[1];

    this.intensityModel = new ToggleModel(true);
    this.computationModel = new ToggleModel(true); // true: GPU / false: CPU
    this.equalizerModel = new EqualizerModel({
      size: this.metadata.layers,
      scalars: this.metadata.scalars,
      lookupTable: this.lookupTable,
    });

    this.intensityModel.onChange((data, envelope) => {
      this.update();
    });
    this.computationModel.onChange((data, envelope) => {
      this.compositor = this.compositors[data ? 1 : 0];
      this.update();
    });
    this.equalizerModel.onChange((data, envelope) => {
      var opacities = data.getOpacities();
      for (let idx = 0; idx < this.metadata.layers; idx++) {
        this.lutTextureData[(idx * 4) + 3] = opacities[idx] * 255;
      }
      this.render();
    });

    // Force the filling of the color texture
    this.lookupTable.setScalarRange(this.originalRange[0], this.originalRange[1]);

    // Relay normal data fetch to query based on
    this.registerSubscription(this.queryDataModel.onDataChange(() => {
      this.update();
    }));

    this.registerSubscription(queryDataModel.on('data_fetch', (data, envelope) => {
      this.compositor.updateData(data);
      this.render();
    }));

    // Handle destroy
    this.registerObjectToFree(this.compositors[0]);
    this.registerObjectToFree(this.compositors[1]);
    this.registerObjectToFree(this.intensityModel);
    this.registerObjectToFree(this.computationModel);
    this.registerObjectToFree(this.equalizerModel);
  }

  // ------------------------------------------------------------------------

  update() {
    if (this.intensityModel.getState()) {
      this.dataQuery.categories = ['_', 'intensity'];
    } else {
      this.dataQuery.categories = ['_'];
    }

    this.queryDataModel.fetchData(this.dataQuery);
  }

  // ------------------------------------------------------------------------

  render() {
    this.compositor.render();
  }

  // ------------------------------------------------------------------------

  destroy() {
    super.destroy();

    this.compositor = null;
    this.compositors = null;
    this.computationModel = null;
    this.dataQuery = null;
    this.equalizerModel = null;
    this.intensityModel = null;
    this.lookupTable = null;
    this.lutTextureData = null;
    this.metadata = null;
    this.originalRange = null;
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    var { lookupTable, equalizer, intensity, computation, queryDataModel } = this.getControlModels();
    return [
      {
        name: 'VolumeControlWidget',
        lookupTable,
        equalizer,
        intensity,
        computation,
      }, {
        name: 'QueryDataModelWidget',
        queryDataModel,
      },
    ];
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      lookupTable: {
        lookupTable: this.lookupTable,
        lookupTableManager: this.lookupTableManager,
        originalRange: this.originalRange,
      },
      equalizer: this.equalizerModel,
      intensity: this.intensityModel,
      computation: this.computationModel,
      queryDataModel: this.queryDataModel,
      dimensions: this.metadata.dimensions,
    };
  }

}
