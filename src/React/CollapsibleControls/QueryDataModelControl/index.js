import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactCollapsibleControls/QueryDataModelControl.mcss';

import CollapsibleWidget        from '../../Widgets/CollapsibleWidget';
import ExploreButton            from '../../Widgets/ToggleIconButtonWidget';
import QueryDataModelWidget     from '../../Widgets/QueryDataModelWidget';

export default class QueryDataModelControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    // Bind callback
    this.toggleExploration = this.toggleExploration.bind(this);
    this.attachListener = this.attachListener.bind(this);
    this.detachListener = this.detachListener.bind(this);
    this.dataListenerCallback = this.dataListenerCallback.bind(this);
  }

  componentWillMount() {
    this.detachListener();
    if (this.props.listener) {
      this.attachListener(this.props.model);
    }
  }

  componentWillReceiveProps(nextProps) {
    var previousDataModel = this.props.model,
      nextDataModel = nextProps.model;

    if (previousDataModel !== nextDataModel) {
      this.detachListener();
      this.attachListener(nextDataModel);
    }
  }

  componentWillUnmount() {
    this.detachListener();
  }

  attachListener(dataModel) {
    this.dataSubscription = dataModel.onStateChange(this.dataListenerCallback);
  }

  detachListener() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  dataListenerCallback(data, envelope) {
    this.forceUpdate();
  }

  toggleExploration(enabled) {
    this.props.model.exploreQuery(enabled, true, !this.props.handleExploration);
  }

  render() {
    var exploreButton = (
      <ExploreButton
        key="explore-button"
        icon={style.exploreIcon}
        onChange={this.toggleExploration}
        value={this.props.model.exploreState.animate}
      />);

    return (
      <CollapsibleWidget
        title="Parameters"
        key="QueryDataModelWidget_parent"
        visible={this.props.model.originalData.arguments_order.length > 0}
        activeSubTitle
        subtitle={exploreButton}
      >
        <QueryDataModelWidget
          key="QueryDataModelWidget"
          model={this.props.model}
        />
      </CollapsibleWidget>);
  }
}

QueryDataModelControl.propTypes = {
  listener: PropTypes.bool,
  handleExploration: PropTypes.bool,
  model: PropTypes.object,
};

QueryDataModelControl.defaultProps = {
  handleExploration: false,
  listener: true,
};
