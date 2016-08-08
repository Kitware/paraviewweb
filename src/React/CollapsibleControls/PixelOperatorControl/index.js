import React                from 'react';

import CollapsibleWidget    from '../../Widgets/CollapsibleWidget';
import TextInputWidget      from '../../Widgets/TextInputWidget';

export default React.createClass({

  displayName: 'PixelOperatorControl',

  propTypes: {
    operator: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      operation: this.props.operator.getOperation(),
    };
  },

  componentWillReceiveProps(nextProps) {
    if (this.state.operation !== nextProps.operator.getOperation()) {
      this.setState({
        operation: nextProps.operator.getOperation(),
      });
    }
  },

  updateOperation(operation) {
    this.setState({
      operation,
    });
    this.props.operator.setOperation(operation);
  },

  render() {
    return (
      <CollapsibleWidget title="Pixel Operation">
        <TextInputWidget value={this.state.operation} onChange={this.updateOperation} />
      </CollapsibleWidget>);
  },
});
