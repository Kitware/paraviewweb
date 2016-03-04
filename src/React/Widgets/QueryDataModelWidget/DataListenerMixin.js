export default {
  // Attach listener by default
  getDefaultProps() {
    return {
      listener: true,
    };
  },

  attachListener(dataModel) {
    this.dataSubscription = dataModel.onStateChange(this.dataListenerCallback);
  },

  detachListener() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  },

  // Auto mount listener unless notified otherwise
  componentWillMount() {
    this.detachListener();
    if (this.props.listener) {
      this.attachListener(this.props.model);
    }
  },

  componentWillUnmount() {
    this.detachListener();
  },

  componentWillReceiveProps(nextProps) {
    var previousDataModel = this.props.model,
      nextDataModel = nextProps.model;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      this.attachListener(nextDataModel);
    }
  },
};
