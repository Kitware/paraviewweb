import React from 'react';
import PropTypes from 'prop-types';

import CollapsibleWidget from '../../Widgets/CollapsibleWidget';
import TextInputWidget   from '../../Widgets/TextInputWidget';

export default class PixelOperatorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      operation: props.operator.getOperation(),
    };

    // Bind callback
    this.updateOperation = this.updateOperation.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.operation !== nextProps.operator.getOperation()) {
      this.setState({
        operation: nextProps.operator.getOperation(),
      });
    }
  }

  updateOperation(operation) {
    this.setState({
      operation,
    });
    this.props.operator.setOperation(operation);
  }

  render() {
    return (
      <CollapsibleWidget title="Pixel Operation">
        <TextInputWidget value={this.state.operation} onChange={this.updateOperation} />
      </CollapsibleWidget>);
  }
}

PixelOperatorControl.propTypes = {
  operator: PropTypes.object.isRequired,
};
