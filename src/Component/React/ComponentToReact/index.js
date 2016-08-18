import React from 'react';

export default React.createClass({

  displayName: 'ComponentToReact',

  propTypes: {
    className: React.PropTypes.string,
    component: React.PropTypes.object,
  },

  componentDidMount() {
    if (this.props.component) {
      this.props.component.setContainer(this.refs.container);
      this.props.component.resize();
    }
  },

  componentDidUpdate() {
    if (this.props.component) {
      this.props.component.resize();
    }
  },

  componentWillUnmount() {
    if (this.props.component) {
      this.props.component.setContainer(null);
    }
  },

  resize() {
    if (this.props.component) {
      this.props.component.resize();
    }
  },

  render() {
    return <div className={this.props.className} ref="container"></div>;
  },
});
