import React from 'react';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

import sizeHelper from '../../../Common/Misc/SizeHelper';

export default class PieceWiseGaussianFunctionEditorWidget extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      height: props.height,
      width: props.width,
    };

    this.widget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [props.width, props.height] });
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

    // Bind methods
    this.updateDimensions = this.updateDimensions.bind(this);
    this.pushOpacities = this.pushOpacities.bind(this);
  }

  componentDidMount() {
    this.widget.setContainer(this.rootContainer);
    this.widget.render();
    this.widget.bindMouseListeners();
    this.widget.onOpacityChange(() => {
      const gaussians = this.widget.get('gaussians').gaussians;
      const nodes = this.widget.getOpacityNodes();
      if (this.props.onChange) {
        this.props.onChange(nodes, gaussians);
      }
    });
    if (this.props.onEditModeChange) {
      this.widget.onAnimation(this.props.onEditModeChange);
    }

    if (this.props.width === -1 || this.props.height === -1) {
      this.sizeSubscription = sizeHelper.onSizeChange(this.updateDimensions);
      sizeHelper.startListening();
      this.updateDimensions();
    }
  }

  componentWillReceiveProps(newProps) {
    const widgetGaussians = JSON.stringify(this.widget.get('gaussians').gaussians);
    if (JSON.stringify(this.props.gaussians) !== widgetGaussians) {
      console.log('replace gaussians');
      this.widget.set({ gaussians: this.props.gaussians });
      this.widget.render();
    }
    if (this.props.width === -1 || this.props.height === -1) {
      this.updateDimensions();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.widget.render();
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

  pushOpacities() {
    this.props.onEditModeChange();
  }

  updateDimensions() {
    const { clientWidth, clientHeight } =
      sizeHelper.getSize(this.rootContainer, true);
    if (this.props.width === -1) {
      this.setState({ width: clientWidth });
    }
    if (this.props.height === -1) {
      this.setState({ height: clientHeight });
    }
  }

  render() {
    this.widget.setSize(this.state.width, this.state.height);
    return (
      <div style={{ overflow: 'hidden', minHeigh: '10px', minWidth: '10px' }} ref={c => (this.rootContainer = c)} />
    );
  }
}

PieceWiseGaussianFunctionEditorWidget.defaultProps = {
  height: 200,
  width: -1,
  points: [],
  gaussians: [{ position: 0.5, height: 1, width: 0.5, xBias: 0.55, yBias: 0.55 }],
};

PieceWiseGaussianFunctionEditorWidget.propTypes = {
  points: React.PropTypes.array,
  gaussians: React.PropTypes.array,
  rangeMin: React.PropTypes.number,
  rangeMax: React.PropTypes.number,
  onChange: React.PropTypes.func,
  onEditModeChange: React.PropTypes.func,
  height: React.PropTypes.number,
  width: React.PropTypes.number,
};
