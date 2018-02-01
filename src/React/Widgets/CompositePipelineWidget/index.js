import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/CompositePipelineWidget.mcss';

import RootItem from './RootItem';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a CompositePipelineModel instance.
 */
export default class CompositePipelineWidget extends React.Component {
  componentDidMount() {
    this.attachListener(this.props.model);
  }

  componentWillReceiveProps(nextProps) {
    const previous = this.props.model;
    const next = nextProps.model;

    if (previous !== next) {
      this.detachListener();
      this.attachListener(next);
    }
  }

  // Auto unmount listener
  componentWillUnmount() {
    this.detachListener();
  }

  attachListener(pipelineModel) {
    this.pipelineSubscription = pipelineModel.onChange((data, envelope) => {
      this.forceUpdate();
    });
  }

  detachListener() {
    if (this.pipelineSubscription) {
      this.pipelineSubscription.unsubscribe();
      this.pipelineSubscription = null;
    }
  }

  render() {
    const pipelineModel = this.props.model;
    const pipelineDescription = pipelineModel.getPipelineDescription();

    return (
      <div className={style.container}>
        {pipelineDescription.map((item, idx) => (
          <RootItem
            key={idx}
            item={item}
            layer={item.ids.join('')}
            model={pipelineModel}
          />
        ))}
      </div>
    );
  }
}

CompositePipelineWidget.propTypes = {
  model: PropTypes.object.isRequired,
};
