import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/QueryDataModelWidget.mcss';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a QueryDataModel instance.
 *   - listener:
 *       Expect a Boolean based on the automatic data model registration for listening.
 *       Default value is true but that should be false is nested.
 *   - arg:
 *       Expect the name of the argument this String UI element control within the model.
 */
export default class ParameterSetString extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.attachListener = this.attachListener.bind(this);
    this.detachListener = this.detachListener.bind(this);
    this.dataListenerCallback = this.dataListenerCallback.bind(this);

    this.handleChange = this.handleChange.bind(this);
    this.grabFocus = this.grabFocus.bind(this);
    this.toggleAnimation = this.toggleAnimation.bind(this);
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

  handleChange(event) {
    if (this.props.model.setValue(this.props.arg, event.target.value)) {
      this.props.model.lazyFetchData();
    }
  }

  grabFocus() {
    this.select.focus();
  }

  toggleAnimation() {
    this.props.model.toggleAnimationFlag(this.props.arg);
    this.setState({});
  }

  render() {
    return (
      <div className={this.props.model.getAnimationFlag(this.props.arg) ? style.itemActive : style.item}>
        <div className={[style.row, style.label].join(' ')} onClick={this.toggleAnimation}>
          {this.props.model.label(this.props.arg)}
        </div>
        <div className={style.row} onMouseEnter={this.grabFocus}>
          <select
            className={style.input}
            ref={(c) => { this.select = c; }}
            value={this.props.model.getValue(this.props.arg)}
            onChange={this.handleChange}
          >
            {this.props.model.getValues(this.props.arg).map(v =>
              <option key={v} value={v}>{v}</option>
            )}
          </select>
        </div>
      </div>
    );
  }
}

ParameterSetString.propTypes = {
  listener: PropTypes.bool,
  arg: PropTypes.string,
  model: PropTypes.object.isRequired,
};

ParameterSetString.defaultProps = {
  listener: true,
};
