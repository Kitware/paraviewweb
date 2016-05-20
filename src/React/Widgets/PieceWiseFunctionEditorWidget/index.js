import LinearPieceWiseEditor from '../../../NativeUI/Canvas/LinearPieceWiseEditor';
import SvgIconWidget from '../SvgIconWidget';
import React from 'react';
import ReactDOM from 'react-dom';
import equals from 'mout/src/lang/deepEquals';
import clone from 'mout/src/lang/deepClone';

import style from 'PVWStyle/ReactWidgets/PieceWiseFunctionEditorWidget.mcss';

import sizeHelper from '../../../Common/Misc/SizeHelper';

import plusIcon from '../../../../svg/colors/Plus.svg';
import trashIcon from '../../../../svg/colors/Trash.svg';
// In javascript, you can't return an object from an => function like this:
// x => { property: x }.  But ESLint doesn't allow this:
// x => { return { property: x }; } since it says all one line returning =>
// functions should not include the outer {} or return keyword.  This is
// a function to allow this syntax: x => makeESLintHappy({ property: x })
function makeESLintHappy(x) {
  return x;
}

export default React.createClass({

  displayName: 'PieceWiseFunctionEditorWidget',

  propTypes: {
    initialPoints: React.PropTypes.array,
    rangeMin: React.PropTypes.number,
    rangeMax: React.PropTypes.number,
    onChange: React.PropTypes.func,
  },

  getInitialState() {
    let controlPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    if (this.props.initialPoints) {
      controlPoints = this.props.initialPoints.map(pt =>
        makeESLintHappy({
          x: (pt.x - this.props.rangeMin) / (this.props.rangeMax - this.props.rangeMin),
          y: pt.y,
        })
      );
    }
    return {
      activePoint: 0,
      width: -1,
      height: 300,
      points: controlPoints,
    };
  },

  componentWillMount() {
    this.sizeSubscription = sizeHelper.onSizeChange(this.updateDimensions);
    sizeHelper.startListening();
  },

  componentDidMount() {
    const canvas = this.refs.canvas;
    this.editor = new LinearPieceWiseEditor(canvas);

    this.editor.setControlPoints(this.state.points);
    this.editor.render();
    this.editor.onChange(this.updatePoints);

    sizeHelper.triggerChange();
  },

  componentDidUpdate(prevProps, prevState) {
    if (this.state.width !== prevState.width) {
      this.editor.render();
    }
    // We get some duplicate events from the editor, filter them out
    if (!equals(this.state.points, prevState.points) ||
        this.props.rangeMin !== prevProps.rangeMin ||
        this.props.rangeMax !== prevProps.rangeMax) {
      const dataPoints = this.state.points.map(pt => makeESLintHappy({
        x: pt.x * (this.props.rangeMax - this.props.rangeMin) + this.props.rangeMin,
        y: pt.y,
      }));
      if (this.props.onChange) {
        this.props.onChange(dataPoints);
      }
    }
  },

  componentWillUnmount() {
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  },

  updateDimensions() {
    const { clientWidth } =
      sizeHelper.getSize(ReactDOM.findDOMNode(this));
    this.setState({ width: clientWidth });
  },

  updatePoints(newPoints, envelope) {
    const activePoint = this.editor.activeIndex;
    this.setState({ points: clone(newPoints), activePoint });
  },

  updateActivePointDataValue(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const value = parseFloat(e.target.value);
    const points = this.state.points.map(pt => makeESLintHappy({ x: pt.x, y: pt.y }));
    points[this.state.activePoint].x =
      (value - this.props.rangeMin) / (this.props.rangeMax - this.props.rangeMin);
    this.editor.setControlPoints(points, this.state.activePoint);
  },

  updateActivePointOpacity(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const value = parseFloat(e.target.value);
    const points = this.state.points.map(pt => makeESLintHappy({ x: pt.x, y: pt.y }));
    points[this.state.activePoint].y = value;
    this.editor.setControlPoints(points, this.state.activePoint);
  },

  addPoint(e) {
    const points = this.state.points.map(pt => makeESLintHappy({ x: pt.x, y: pt.y }));
    points.push({ x: 0.5, y: 0.5 });
    this.editor.setControlPoints(points, points.length - 1);
  },

  removePoint(e) {
    if (this.state.activePoint === -1) {
      return;
    }
    const points = this.state.points.map(pt => makeESLintHappy({ x: pt.x, y: pt.y }));
    points.splice(this.state.activePoint, 1);
    this.editor.setActivePoint(-1);
    this.editor.setControlPoints(points);
  },

  render() {
    const activePointDataValue = (this.state.activePoint !== -1 ?
      this.state.points[this.state.activePoint].x : 0.5) *
      (this.props.rangeMax - this.props.rangeMin) + this.props.rangeMin;
    const activePointOpacity = this.state.activePoint !== -1 ?
      this.state.points[this.state.activePoint].y : 0.5;
    return (
      <div className={style.pieceWiseFunctionEditorWidget}>
        <canvas
          className={style.canvas}
          width={this.state.width}
          height={this.state.height}
          ref="canvas"
        />
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
      </div>
    );
  },
});
