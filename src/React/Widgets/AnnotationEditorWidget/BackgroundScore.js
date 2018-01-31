import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

export default function render(props) {
  return (
    <div
      className={style.backgroundScore}
      style={{
        background: props.color,
        top: `${props.index * props.step + props.margin}px`,
        height: props.fullHeight
          ? `calc(100% - ${2 * props.margin}px)`
          : `${props.step - 2 * props.margin}px`,
      }}
    />
  );
}

render.propTypes = {
  color: PropTypes.string,
  index: PropTypes.number,
  step: PropTypes.number,
  margin: PropTypes.number,
  fullHeight: PropTypes.bool,
};

render.defaultProps = {
  index: 0,
  step: 28,
  margin: 1,
  fullHeight: false,
};
