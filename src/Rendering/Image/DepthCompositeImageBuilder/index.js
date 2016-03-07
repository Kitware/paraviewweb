import AbstractImageBuilder from '../AbstractImageBuilder';
import Factory from './CompositorFactory';

export default class DepthCompositeImageBuilder extends AbstractImageBuilder {

  // ------------------------------------------------------------------------

  constructor(queryDataModel, pipelineModel, lookupTableManager) {
    super({ queryDataModel, pipelineModel, dimensions: queryDataModel.originalData.CompositePipeline.dimensions });

    this.compositor = Factory.createCompositor(queryDataModel.originalData.type, {
      queryDataModel, lookupTableManager, imageBuilder: this,
    });
    this.registerObjectToFree(this.compositor);

    this.query = null;
    this.setPipelineQuery(this.pipelineModel.getPipelineQuery());

    this.registerSubscription(this.pipelineModel.onChange((data, envelope) => {
      this.setPipelineQuery(data);
    }));
  }

  // ------------------------------------------------------------------------
  // Update the composite pipeline query
  // Sample query: "BACADAGBHBIB" means color layers B, C, and D by field A,
  // color layers G, H, and I by field B

  setPipelineQuery(query) {
    if (this.query !== query) {
      this.query = query;
      this.compositor.updateQuery(query);
      this.render();
    }
  }

  // ------------------------------------------------------------------------

  render() {
    if (this.query) {
      this.compositor.render();
    }
  }

  // ------------------------------------------------------------------------

  getControlWidgets() {
    if (this.compositor.getControlWidgets) {
      return this.compositor.getControlWidgets();
    }

    return super.getControlWidgets();
  }

  // ------------------------------------------------------------------------

  getControlModels() {
    if (this.compositor.getControlModels) {
      return this.compositor.getControlModels();
    }

    return super.getControlModels();
  }

}
