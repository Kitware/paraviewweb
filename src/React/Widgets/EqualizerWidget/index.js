import equals       from 'mout/src/array/equals';
import React        from 'react';

import style from 'PVWStyle/ReactWidgets/EqualizerWidget.mcss';

import MouseHandler from '../../../Interaction/Core/MouseHandler';

import SizeHelper from '../../../Common/Misc/SizeHelper';

export default React.createClass({

  displayName: 'EqualizerWidget',

  propTypes: {
    colors: React.PropTypes.array,
    height: React.PropTypes.number,
    layers: React.PropTypes.array,
    onChange: React.PropTypes.func,
    spacing: React.PropTypes.number,
    stroke: React.PropTypes.string,
    width: React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      layers: [1, 1, 1, 1, 1, 1, 1],
      colors: ['#0000ff', '#ffffff', '#ff0000'],
      stroke: '#000000',
      height: 120,
      width: 300,
      spacing: 2,
    };
  },

  getInitialState() {
    return {
      layers: this.props.layers,
      width: this.props.width,
      height: this.props.height,
    };
  },

  componentWillMount() {
    // Listen to window resize
    this.sizeSubscription = SizeHelper.onSizeChange(this.updateDimensions);

    // Make sure we monitor window size if it is not already the case
    SizeHelper.startListening();
  },

  componentDidMount() {
    this.updateDimensions();
    this.draw();
    this.mouseHandler = new MouseHandler(this.canvas);
    this.mouseHandler.attach({
      click: this.clicked,
      drag: this.clicked,
    });
  },

  componentWillReceiveProps(nextProps) {
    const layers = nextProps.layers;

    if (!equals(this.state.layers, layers)) {
      this.setState({ layers });
    }
  },

  componentDidUpdate(prevProps, prevState) {
    this.draw();
  },

  componentWillUnmount() {
    this.mouseHandler.destroy();
    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  },

  updateDimensions() {
    var el = this.rootContainer.parentNode,
      innerWidth = SizeHelper.getSize(el, true).clientWidth;

    if (el && innerWidth && (this.state.width !== innerWidth)) {
      this.setState({ width: innerWidth });
      return true;
    }
    return false;
  },

  draw() {
    var ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = this.props.stroke;
    ctx.lineWidth = '1';

    const array = this.state.layers,
      width = this.state.width,
      height = this.state.height,
      size = array.length,
      spacing = this.props.spacing,
      layerWidth = Math.floor(((width - (5 * spacing)) / size) - spacing),
      maxLayerHeight = height - (4 * spacing),
      layerStep = layerWidth + ((width - (layerWidth * array.length) - (2 * spacing)) / (array.length + 1));

    ctx.clearRect(0, 0, this.state.width, this.state.height);

    ctx.beginPath();
    ctx.rect(spacing, spacing, width - (2 * spacing), height - (2 * spacing));
    ctx.stroke();

    for (let i = 0; i < size; i++) {
      const layerHeight = array[i] * maxLayerHeight;

      ctx.fillStyle = this.props.colors[i % this.props.colors.length];
      ctx.fillRect((layerStep * i) + (2 * spacing), height - layerHeight - (2 * spacing), layerWidth, layerHeight);

      ctx.beginPath();
      ctx.rect((layerStep * i) + (2 * spacing), height - layerHeight - (2 * spacing), layerWidth, layerHeight);
      ctx.stroke();
    }

    // Draw Grid
    // var yStep = maxLayerHeight / 10;
    // ctx.fillStyle = '#ffffff';
    // for(var i = 0; i < 9; i++) {
    //   ctx.beginPath();
    //   ctx.fillRect(spacing*1.5, (1+i)*yStep + 2 * spacing, width - 3.5 * spacing, 1);
    //   ctx.stroke();
    // }
  },

  clicked(e) {
    var rect = this.canvas.getClientRects()[0],
      x = e.pointers[0].clientX - rect.left - (2 * this.props.spacing),
      y = e.pointers[0].clientY - rect.top - (2 * this.props.spacing),
      effectiveHeight = rect.height - (4 * this.props.spacing),
      idx = Math.min(this.state.layers.length - 1, Math.floor((x / (rect.width - (4 * this.props.spacing))) * this.state.layers.length)),
      opacity = 1.0 - (y / effectiveHeight),
      layers = [].concat(this.state.layers);

    opacity = (opacity > 1.0) ? 1.0 : opacity;
    opacity = (opacity < 0.0) ? 0.0 : opacity;
    layers[idx] = opacity;

    this.setState({ layers });
    if (this.props.onChange) {
      this.props.onChange(layers);
    }
    this.draw();
  },

  render() {
    return (
      <div className={style.container} ref={c => (this.rootContainer = c)}>
        <canvas
          className={style.canvas}
          ref={(c) => { this.canvas = c; }}
          width={this.state.width}
          height={this.state.height}
        />
      </div>
    );
  },
});
