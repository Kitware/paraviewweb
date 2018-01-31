import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

export default function render(props) {
  const click = (event) => {
    props.onChange(props.name, Number(event.target.getAttribute('data-score')));
  };

  return (
    <section className={[style.scoreContainer, props.className].join(' ')}>
      {props.scores.map((score, idx) => (
        <div
          key={idx}
          className={
            props.score === idx ? style.selectedScoreBlock : style.scoreBlock
          }
          style={{
            background: score.color,
            display: props.horizontal ? 'inline-block' : 'block',
          }}
          title={score.name}
          data-score={idx}
          onClick={click}
        />
      ))}
    </section>
  );
}

render.propTypes = {
  name: PropTypes.string,
  score: PropTypes.number,
  scores: PropTypes.array,
  onChange: PropTypes.func,
  horizontal: PropTypes.bool,
  className: PropTypes.string,
};

render.defaultProps = {
  name: 'default',
  horizontal: false,
  onChange(name, score) {},
};
