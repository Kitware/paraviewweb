import Monologue from 'monologue.js';

const
  IMAGE_READY_TOPIC = 'image-ready';

export default class AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor({ queryDataModel, pipelineModel, lookupTableManager, handleRecord = false, dimensions = [500, 500] }) {
    this.queryDataModel = queryDataModel;
    this.pipelineModel = pipelineModel;
    this.lookupTableManager = lookupTableManager;
    this.handleRecord = handleRecord;
    this.subscriptions = [];
    this.objectsToFree = [];
    this.dimensions = dimensions;

    this.controlWidgets = [];
    if (this.lookupTableManager) {
      this.controlWidgets.push({
        name: 'LookupTableManagerWidget',
        lookupTableManager,
      });
    }
    if (this.pipelineModel) {
      this.controlWidgets.push({
        name: 'CompositeControl',
        pipelineModel,
      });
    }
    if (this.queryDataModel) {
      this.controlWidgets.push({
        name: 'QueryDataModelWidget',
        queryDataModel,
      });
    }
  }

  // ------------------------------------------------------------------------

  update() {
    if (this.queryDataModel) {
      this.queryDataModel.fetchData();
    }
  }

  // ------------------------------------------------------------------------

  onImageReady(callback) {
    return this.on(IMAGE_READY_TOPIC, callback);
  }

  // ------------------------------------------------------------------------

  imageReady(readyImage) {
    this.emit(IMAGE_READY_TOPIC, readyImage);
  }

  // ------------------------------------------------------------------------

  registerSubscription(subscription) {
    this.subscriptions.push(subscription);
  }

  // ------------------------------------------------------------------------

  registerObjectToFree(obj) {
    this.objectsToFree.push(obj);
  }

  // ------------------------------------------------------------------------

  getListeners() {
    return this.queryDataModel ? this.queryDataModel.getMouseListener() : {};
  }

  // ------------------------------------------------------------------------

  // Method meant to be used with the WidgetFactory
  getControlWidgets() {
    return this.controlWidgets;
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    return {
      pipelineModel: this.pipelineModel,
      queryDataModel: this.queryDataModel,
      lookupTableManager: this.lookupTableManager,
      dimensions: this.dimensions,
    };
  }

  // ------------------------------------------------------------------------

  destroy() {
    this.off();

    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }

    while (this.objectsToFree.length) {
      this.objectsToFree.pop().destroy();
    }

    this.queryDataModel = null;
    this.pipelineModel = null;
    this.lookupTableManager = null;
    this.dimensions = null;
    this.controlWidgets = null;
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(AbstractImageBuilder);
