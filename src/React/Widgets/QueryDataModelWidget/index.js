import React                    from 'react';
import style                    from 'PVWStyle/ReactWidgets/QueryDataModelWidget.mcss';

import ListWidget               from './String';
import NumberWidget             from './Number';
import DataListenerMixin        from './DataListenerMixin';
import DataListenerUpdateMixin  from './DataListenerUpdateMixin';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a QueryDataModel instance.
 *   - listener:
 *       Expect a Boolean based on the automatic data model registration for listening.
 *       Default value is true and false for the sub components.
 */
export default React.createClass({

  displayName: 'QueryDataModelWidget',

  propTypes: {
    model: React.PropTypes.object,
  },

  mixins: [DataListenerMixin, DataListenerUpdateMixin],

  render() {
    var model = this.props.model,
      args = model.originalData.arguments,
      orderList = model.originalData.arguments_order.filter(name => args[name].values.length > 1);

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
              />);
          } else if (model.getUiType(name) === 'slider') {
            return (
              <NumberWidget
                key={name}
                model={model}
                arg={name}
                listener={false}
              />);
          }
          return null;
        })}
      </div>);
  },
});
