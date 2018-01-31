/* eslint-disable no-underscore-dangle */
import React from 'react';
import PropTypes from 'prop-types';

export default class ResplendentWidget extends React.Component {
  constructor(props) {
    super(props);
    this.applyRef = this.applyRef.bind(this);
  }

  componentDidMount() {
    const Class = this.props.component;
    if (Class) {
      // Instantiate the resplendent component with the specified args.
      this.resp = new Class(this._elt, ...this.props.args);
      this.resp.render();
    }
  }

  componentWillUnmount() {
    if (this.resp && this.resp.destroy) {
      this.resp.destroy();
    }
    this.resp = null;
  }

  applyRef(elt) {
    this._elt = elt;
    return elt;
  }

  render() {
    return <div ref={this.applyRef} />;
  }
}

ResplendentWidget.propTypes = {
  args: PropTypes.array,
  component: PropTypes.func.isRequired,
};

ResplendentWidget.defaultProps = {
  args: [],
};
