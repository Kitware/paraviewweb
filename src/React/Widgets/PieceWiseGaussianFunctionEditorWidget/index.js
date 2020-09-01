import React from 'react';
import PropTypes from 'prop-types';

import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

import sizeHelper from '../../../Common/Misc/SizeHelper';

const defaultGaussians =
  '[{ "position": 0.5, "height": 1, "width": 0.5, "xBias": 0.55, "yBias": 0.55 }]';

export default class PieceWiseGaussianFunctionEditorWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: props.height,
      width: props.width,
      gaussians: props.gaussians
        ? props.gaussians
        : JSON.parse(defaultGaussians),
    };

    this.widget = vtkPiecewiseGaussianWidget.newInstance({
      numberOfBins: 256,
      size: [props.width, props.height],
    });
    this.widget.updateStyle({
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
      strokeColor: 'rgb(0, 0, 0)',
      activeColor: 'rgb(255, 255, 255)',
      handleColor: 'rgb(50, 150, 50)',
      strokeWidth: 2,
      activeStrokeWidth: 3,
      iconSize: 0,
      padding: 10,
    });
    this.bgImage = new Image();

    // Bind methods
    this.updateDimensions = this.updateDimensions.bind(this);
    this.updateWidget = this.updateWidget.bind(this);
  }

  componentDidMount() {
    this.widget.setContainer(this.rootContainer);
    this.widget.bindMouseListeners();

    if (this.props.onEditModeChange) {
      this.widget.onAnimation((editting) => {
        if (!editting) {
          if (this.props.onChange) {
            const gaussians = this.widget.get('gaussians').gaussians;
            const nodes = this.widget.getOpacityNodes();
            this.props.onChange(nodes, gaussians);
          }
        }
        this.props.onEditModeChange(editting);
      });
    }

    if (this.props.width === -1 || this.props.height === -1) {
      this.sizeSubscription = sizeHelper.onSizeChangeForElement(
        this.rootContainer,
        this.updateDimensions
      );
      sizeHelper.startListening();
      this.updateDimensions();
    }
    this.updateWidget();
  }

  componentWillReceiveProps(newProps) {
    const gaussians = !newProps.gaussians
      ? JSON.parse(defaultGaussians)
      : newProps.gaussians;
    this.setState({ gaussians });
    if (this.props.width === -1 || this.props.height === -1) {
      this.updateDimensions();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateWidget();
  }

  componentWillUnmount() {
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
      this.widget.unbindMouseListeners();
      this.widget.delete(); // Remove subscriptions
      this.widget = null;
    }
  }

  updateDimensions() {
    const { clientWidth, clientHeight } = sizeHelper.getSize(
      this.rootContainer,
      true
    );
    if (this.props.width === -1) {
      this.setState({ width: clientWidth });
    }
    if (this.props.height === -1) {
      this.setState({ height: clientHeight });
    }
  }

  updateWidget() {
    if (this.state.gaussians) {
      this.widget.setGaussians(this.state.gaussians);
    }
    if (this.props.bgImage) {
      this.bgImage.src = `data:image/png;base64,${this.props.bgImage}`;
      this.widget.setBackgroundImage(this.bgImage);
    }

    this.widget.render();
  }

  render() {
    this.widget.setSize(this.state.width, this.state.height);
    return (
      <div
        style={{ overflow: 'hidden', minHeigh: '10px', minWidth: '10px' }}
        ref={(c) => {
          this.rootContainer = c;
        }}
      />
    );
  }
}

PieceWiseGaussianFunctionEditorWidget.defaultProps = {
  height: 200,
  width: -1,
  bgImage: null,

  gaussians: undefined,
  onChange: undefined,
  onEditModeChange: undefined,
};

PieceWiseGaussianFunctionEditorWidget.propTypes = {
  // points: PropTypes.array,
  gaussians: PropTypes.array,
  onChange: PropTypes.func,
  onEditModeChange: PropTypes.func,
  height: PropTypes.number,
  width: PropTypes.number,
  bgImage: PropTypes.string,
};
