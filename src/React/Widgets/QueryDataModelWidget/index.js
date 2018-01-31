import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/QueryDataModelWidget.mcss';

import ListWidget from './String';
import NumberWidget from './Number';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a QueryDataModel instance.
 *   - listener:
 *       Expect a Boolean based on the automatic data model registration for listening.
 *       Default value is true and false for the sub components.
 */
export default class QueryDataModelWidget extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.attachListener = this.attachListener.bind(this);
    this.detachListener = this.detachListener.bind(this);
    this.dataListenerCallback = this.dataListenerCallback.bind(this);
  }

  // Auto mount listener unless notified otherwise
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

  render() {
    var model = this.props.model,
      args = model.originalData.arguments,
      orderList = model.originalData.arguments_order.filter(
        (name) => args[name].values.length > 1
      );

    return (
      <div className={style.container}>
        {orderList.map((name) => {
          if (model.getUiType(name) === 'list') {
            return (
              <ListWidget
                key={name}
                model={model}
                arg={name}
                listener={false}
              />
            );
          } else if (model.getUiType(name) === 'slider') {
            return (
              <NumberWidget
                key={name}
                model={model}
                arg={name}
                listener={false}
              />
            );
          }
          return null;
        })}
      </div>
    );
  }
}

QueryDataModelWidget.propTypes = {
  listener: PropTypes.bool,
  model: PropTypes.object,
};

QueryDataModelWidget.defaultProps = {
  listener: true,
};
