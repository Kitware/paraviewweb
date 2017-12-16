import React from 'react';
import PropTypes from 'prop-types';

export default class ComponentToReact extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.resize = this.resize.bind(this);
  }

  componentDidMount() {
    if (this.props.component) {
      this.props.component.setContainer(this.container);
      this.props.component.resize();
    }
  }

  componentDidUpdate() {
    if (this.props.component) {
      this.props.component.resize();
    }
  }

  componentWillUnmount() {
    if (this.props.component) {
      this.props.component.setContainer(null);
    }
  }

  resize() {
    if (this.props.component) {
      this.props.component.resize();
    }
  }

  render() {
    return <div className={this.props.className} ref={c => (this.container = c)} />;
  }
}

ComponentToReact.propTypes = {
  className: PropTypes.string,
  component: PropTypes.object,
};
