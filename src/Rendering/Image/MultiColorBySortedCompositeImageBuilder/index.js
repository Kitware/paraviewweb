import AbstractImageBuilder from '../AbstractImageBuilder';
import ColorByHelper from './colorByHelper';
import CPUCompositor from './cpu-compositor';
import GPUCompositor from './gpu-compositor';
import ToggleModel from '../../../Common/State/ToggleState';

import '../../../React/CollapsibleControls/CollapsibleControlFactory/LookupTableManagerWidget';
import '../../../React/CollapsibleControls/CollapsibleControlFactory/LightPropertiesWidget';
import '../../../React/CollapsibleControls/CollapsibleControlFactory/CompositeControl';
import '../../../React/CollapsibleControls/CollapsibleControlFactory/QueryDataModelWidget';

const FETCH_DATA_TOPIC = 'data_to_fetch';
const LIGHT_PROP_CHANGE =
  'MultiColorBySortedCompositeImageBuilder.light.change';

export default class MultiColorBySortedCompositeImageBuilder extends AbstractImageBuilder {
  // ------------------------------------------------------------------------

  constructor(queryDataModel, lookupTableManager, pipelineModel) {
    super({
      queryDataModel,
      lookupTableManager,
      pipelineModel,
      handleRecord: true,
      dimensions: queryDataModel.originalData.SortedComposite.dimensions,
    });

    this.metadata = queryDataModel.originalData.SortedComposite;
    this.intensityModel = new ToggleModel(true);
    this.normalsModel = new ToggleModel(false);
    this.computationModel = new ToggleModel(true);

    this.intensityModel.onChange((data, envelope) => {
      this.update();
    });

    this.normalsModel.onChange((data, envelope) => {
      this.update();
    });

    this.computationModel.onChange((data, envelope) => {
      this.compositor = this.compositors[data ? 1 : 0];
      this.update();
    });

    // Update LookupTableManager with data range
    this.lookupTableManager.addFields(
      this.metadata.ranges,
      this.queryDataModel.originalData.LookupTables
    );

    // Need to have the LookupTable created
    this.colorHelper = new ColorByHelper(
      this.metadata.pipeline,
      queryDataModel.originalData.CompositePipeline.fields,
      lookupTableManager
    );

    this.lookupTableManager.updateActiveLookupTable(
      this.metadata.activeLookupTable ||
        this.metadata.pipeline[0].colorBy[0].name
    );
    this.dataQuery = {
      name: FETCH_DATA_TOPIC,
      categories: [],
    };

    this.compositors = [
      new CPUCompositor(
        queryDataModel,
        this,
        this.colorHelper,
        this.metadata.reverseCompositePass
      ),
      new GPUCompositor(
        queryDataModel,
        this,
        this.colorHelper,
        this.metadata.reverseCompositePass
      ),
    ];
    this.compositor = this.compositors[1];

    this.controlWidgets = [
      {
        name: 'LookupTableManagerWidget',
        lookupTableManager: this.lookupTableManager,
      },
      {
        name: 'LightPropertiesWidget',
        light: this,
      },
      {
        name: 'CompositeControl',
        pipelineModel: this.pipelineModel,
      },
      {
        name: 'QueryDataModelWidget',
        queryDataModel: this.queryDataModel,
      },
    ];
    if (this.metadata.light && this.metadata.light.indexOf('normal') >= 0) {
      if (this.metadata.light.indexOf('intensity') < 0) {
        this.normalsModel.setState(true);
      }
    } else {
      // No LightPropertiesWidget
      this.controlWidgets.splice(1, 1);
    }

    // Relay normal data fetch to query based on
    this.registerSubscription(
      this.queryDataModel.onDataChange(() => {
        this.update();
      })
    );

    this.registerSubscription(
      queryDataModel.on(FETCH_DATA_TOPIC, (data, envelope) => {
        this.colorHelper.updateData(data);
        this.compositor.updateData(data);
        this.render();
      })
    );

    this.registerSubscription(
      this.pipelineModel.onChange((data, envelope) => {
        this.colorHelper.updatePipeline(data);
        this.update();
      })
    );
    this.colorHelper.updatePipeline(this.pipelineModel.getPipelineQuery());

    this.registerSubscription(
      this.lookupTableManager.onChange((data, envelope) => {
        this.render();
      })
    );

    this.registerSubscription(
      this.pipelineModel.onOpacityChange((data, envelope) => {
        this.colorHelper.updateAlphas(data);
        this.render();
      })
    );

    // Set initial opacity
    this.pipelineModel.resetOpacity(100);

    // Manage destroy
    this.registerObjectToFree(this.compositors[0]);
    this.registerObjectToFree(this.compositors[1]);
  }

  // ------------------------------------------------------------------------

  update() {
    if (this.normalsModel.getState()) {
      this.dataQuery.categories = ['_', 'normal'].concat(
        this.colorHelper.getCategories()
      );
    } else if (this.intensityModel.getState()) {
      this.dataQuery.categories = ['_', 'intensity'].concat(
        this.colorHelper.getCategories()
      );
    } else {
      this.dataQuery.categories = ['_'].concat(
        this.colorHelper.getCategories()
      );
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

    this.compositors = null;
    this.compositor = null;
  }

  // ------------------------------------------------------------------------

  getLightingEnabled() {
    return this.normalsModel.getState();
  }

  // ------------------------------------------------------------------------

  setLightingEnabled(lightingEnabled) {
    this.normalsModel.setState(lightingEnabled);
  }

  // ------------------------------------------------------------------------

  getLightProperties() {
    return this.compositor.getLightProperties();
  }

  // ------------------------------------------------------------------------

  setLightProperties(lightProps) {
    const changeDetected = this.compositor.setLightProperties(lightProps);
    this.render();
    if (changeDetected) {
      this.emit(LIGHT_PROP_CHANGE, this.getLightProperties());
    }
  }

  // ------------------------------------------------------------------------

  onLightPropertyChange(callback) {
    return this.on(LIGHT_PROP_CHANGE, callback);
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      lookupTableManager: this.lookupTableManager,
      intensity: this.intensityModel,
      computation: this.computationModel,
      normal: this.normalsModel,
      queryDataModel: this.queryDataModel,
      light: this,
      dimensions: this.metadata.dimensions,
    };
  }
}
