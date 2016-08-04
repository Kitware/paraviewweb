import React from 'react';
import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

export default function bgScore(props) {
  return (
    <div
      className={style.backgroundScore}
      style={{
        background: props.color,
        top: `${props.index * props.step + props.margin}px`,
        height: `${props.step - 2 * props.margin}px`,
      }}
    />);
}

bgScore.propTypes = {
  color: React.PropTypes.string,
  index: React.PropTypes.number,
  step: React.PropTypes.number,
  margin: React.PropTypes.number,
};

bgScore.DefaultProps = {
  index: 0,
  step: 30,
  margin: 1,
};
