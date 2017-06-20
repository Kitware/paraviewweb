import React from 'react';
import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

export default function render(props) {
  return (
    <div
      className={style.backgroundScore}
      style={{
        background: props.color,
        top: `${(props.index * props.step) + props.margin}px`,
        height: props.fullHeight ? `calc(100% - ${(2 * props.margin)}px)` : `${props.step - (2 * props.margin)}px`,
      }}
    />);
}

render.propTypes = {
  color: React.PropTypes.string,
  index: React.PropTypes.number,
  step: React.PropTypes.number,
  margin: React.PropTypes.number,
  fullHeight: React.PropTypes.bool,
};

render.defaultProps = {
  index: 0,
  step: 28,
  margin: 1,
  fullHeight: false,
};
