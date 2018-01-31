import AbstractImageBuilder from '../AbstractImageBuilder';

export default class QueryDataModelImageBuilder extends AbstractImageBuilder {
  // ------------------------------------------------------------------------

  constructor(queryDataModel) {
    super({
      queryDataModel,
      dimensions: queryDataModel.originalData.data[0].dimensions || [500, 500],
    });

    this.lastQueryImage = null;
    this.onLoadCallback = () => {
      this.lastQueryImage.removeEventListener('load', this.onLoadCallback);
      this.render();
    };

    this.registerSubscription(
      queryDataModel.onDataChange((data, envelope) => {
        if (this.lastQueryImage) {
          this.lastQueryImage.removeEventListener('load', this.onLoadCallback);
        }

        if (data.image) {
          this.lastQueryImage = data.image.image;
          this.render();
        }
      })
    );
  }

  // ------------------------------------------------------------------------

  render() {
    if (!this.lastQueryImage) {
      this.queryDataModel.fetchData();
      return;
    }

    if (this.lastQueryImage.complete) {
      const width = this.lastQueryImage.width,
        height = this.lastQueryImage.height;

      this.imageReady({
        canvas: this.lastQueryImage,
        area: [0, 0, width, height],
        outputSize: [width, height],
        builder: this,
        arguments: this.queryDataModel.getQuery(),
      });
    } else {
      this.lastQueryImage.addEventListener('load', this.onLoadCallback);
    }
  }
}
