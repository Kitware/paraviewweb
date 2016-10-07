import React from 'react';
import equals from 'mout/src/lang/deepEquals';

import style from 'PVWStyle/ReactWidgets/PieceWiseFunctionEditorWidget.mcss';

import LinearPieceWiseEditor from '../../../NativeUI/Canvas/LinearPieceWiseEditor';
import SvgIconWidget from '../SvgIconWidget';

import sizeHelper from '../../../Common/Misc/SizeHelper';

import plusIcon from '../../../../svg/colors/Plus.svg';
import trashIcon from '../../../../svg/colors/Trash.svg';

export default React.createClass({

  displayName: 'PieceWiseFunctionEditorWidget',

  propTypes: {
    points: React.PropTypes.array,
    rangeMin: React.PropTypes.number,
    rangeMax: React.PropTypes.number,
    onChange: React.PropTypes.func,
    onEditModeChange: React.PropTypes.func,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
    hidePointControl: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      height: 200,
      width: -1,
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };
  },

  getInitialState() {
    return {
      height: this.props.height,
      width: this.props.width,
      activePoint: -1,
    };
  },

  componentDidMount() {
    const canvas = this.canvas;
    this.editor = new LinearPieceWiseEditor(canvas);

    this.editor.setControlPoints(this.props.points);
    this.editor.render();
    this.editor.onChange(this.updatePoints);
    this.editor.onEditModeChange(this.props.onEditModeChange);

    if (this.props.width === -1 || this.props.height === -1) {
      this.sizeSubscription = sizeHelper.onSizeChange(this.updateDimensions);
      sizeHelper.startListening();
      this.updateDimensions();
    }
  },

  componentWillReceiveProps(newProps) {
    const newState = {};
    if (!equals(newProps.points, this.props.points)) {
      this.editor.setControlPoints(newProps.points, this.editor.activeIndex);
      if (this.state.activePoint >= newProps.points.length) {
        newState.activePoint = -1;
      }
    }
    if (newProps.width !== this.props.width) {
      newState.width = newProps.width;
    }
    if (newProps.height !== this.props.height) {
      newState.height = newProps.height;
    }
    if (this.props.width === -1 || this.props.height === -1) {
      this.updateDimensions();
    }
    this.setState(newState);
  },

  componentDidUpdate(prevProps, prevState) {
    if (this.state.width !== prevState.width ||
        this.state.height !== prevState.height) {
      this.editor.render();
    }
  },

  componentWillUnmount() {
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
      this.editor.destroy(); // Remove subscriptions
      this.editor = null;
    }
  },

  updateDimensions() {
    const { clientWidth, clientHeight } =
      sizeHelper.getSize(this.rootContainer, true);
    if (this.props.width === -1) {
      this.setState({ width: clientWidth });
    }
    if (this.props.height === -1) {
      this.setState({ height: clientHeight });
    }
  },

  updatePoints(newPoints, envelope) {
    const activePoint = this.editor.activeIndex;
    this.setState({ activePoint });
    const dataPoints = this.props.points.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    const newDataPoints = newPoints.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    this.oldPoints = dataPoints;
    if (this.props.onChange) {
      this.props.onChange(newDataPoints);
    }
  },

  updateActivePointDataValue(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const value = parseFloat(e.target.value);
    const points = this.props.points.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    points[this.state.activePoint].x =
      (value - this.props.rangeMin) / (this.props.rangeMax - this.props.rangeMin);
    this.editor.setControlPoints(points, this.state.activePoint);
  },

  updateActivePointOpacity(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const value = parseFloat(e.target.value);
    const points = this.props.points.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    points[this.state.activePoint].y = value;
    this.editor.setControlPoints(points, this.state.activePoint);
  },

  addPoint(e) {
    const points = this.props.points.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    points.push({
      x: 0.5,
      y: 0.5,
      x2: 0.5,
      y2: 0.5,
    });
    this.editor.setControlPoints(points, points.length - 1);
  },

  removePoint(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const points = this.props.points.map(pt => ({
      x: pt.x,
      y: pt.y,
      x2: pt.x2 || 0.5,
      y2: pt.y2 || 0.5,
    }));
    points.splice(this.state.activePoint, 1);
    this.editor.setActivePoint(-1);
    this.editor.setControlPoints(points);
  },

  render() {
    const activePointDataValue = ((this.state.activePoint !== -1 ?
          this.props.points[this.state.activePoint].x : 0.5) *
          (this.props.rangeMax - this.props.rangeMin)) + this.props.rangeMin;
    const activePointOpacity = this.state.activePoint !== -1 ?
      this.props.points[this.state.activePoint].y : 0.5;
    return (
      <div className={style.pieceWiseFunctionEditorWidget} ref={c => (this.rootContainer = c)}>
        <canvas
          className={style.canvas}
          width={this.state.width}
          height={this.state.height}
          ref={(c) => { this.canvas = c; }}
        />
        {this.props.hidePointControl ? null :
          <div className={style.pointControls}>
            <div className={style.pointInfo}>
              <div className={style.line}>
                <label>Data</label>
                <input
                  className={style.input}
                  type="number"
                  step="any"
                  min={this.props.rangeMin}
                  max={this.props.rangeMax}
                  value={activePointDataValue}
                  onChange={this.updateActivePointDataValue}
                />
              </div>
              <div className={style.line}>
                <label>Opacity</label>
                <input
                  className={style.input}
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={Math.floor(100 * activePointOpacity) / 100}
                  onChange={this.updateActivePointOpacity}
                />
              </div>
            </div>
            <SvgIconWidget className={style.svgIcon} icon={plusIcon} onClick={this.addPoint} />
            <SvgIconWidget className={style.svgIcon} icon={trashIcon} onClick={this.removePoint} />
          </div>
        }
      </div>
    );
  },
});
