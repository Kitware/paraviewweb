import React        from 'react';
import ReactDOM     from 'react-dom';
import sizeHelper   from '../../../Common/Misc/SizeHelper';

export default React.createClass({

  displayName: 'GeometryRenderer',

  propTypes: {
    geometryBuilder: React.PropTypes.object,
  },

  getDefaultProps() {
    return {};
  },

  getInitialState() {
    return {
      width: 200,
      height: 200,
    };
  },

  componentWillMount() {
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChange(this.updateDimensions);

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
  },

  componentDidMount() {
    if (this.props.geometryBuilder) {
      this.props.geometryBuilder.configureRenderer(ReactDOM.findDOMNode(this.refs.canvasRenderer));
      this.props.geometryBuilder.render();
    }
    this.updateDimensions();
  },

  componentDidUpdate(nextProps, nextState) {
    this.updateDimensions();
  },

  componentWillUnmount() {
    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  },

  updateDimensions() {
    var el = ReactDOM.findDOMNode(this).parentNode,
      elSize = sizeHelper.getSize(el);

    if (el && (this.state.width !== elSize.clientWidth || this.state.height !== elSize.clientHeight)) {
      this.setState({
        width: elSize.clientWidth,
        height: elSize.clientHeight,
      });

      if (this.props.geometryBuilder) {
        this.props.geometryBuilder.updateSize(innerWidth, innerHeight);
      }
      return true;
    }
    return false;
  },

  resetCamera() {
    if (this.props.geometryBuilder) {
      this.props.geometryBuilder.resetCamera();
    }
  },

  render() {
    return (
      <canvas
        className="CanvasImageRenderer"
        ref="canvasRenderer"
        width={ this.state.width }
        height={ this.state.height }
      >
      </canvas>);
  },
});
