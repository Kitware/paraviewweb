import React from 'react';
import ScoreSelector from '../ScoreSelector';
import BGSelector from '../BackgroundScore';
import SelectionEditorWidget from '../../SelectionEditorWidget';
import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

export default function manyScoreAnnotationEditorWidget(props) {
  const scoreToColor = {};
  props.scores.forEach(score => {
    scoreToColor[score.value] = score.color;
  });
  return (
    <div className={style.verticalContainer}>
      <section className={style.lineContainerSpaceBetween}>
        <SelectionEditorWidget
          className={style.flexItem}
          selection={props.annotation.selection}
          ranges={props.ranges}
          getLegend={props.getLegend}
          onChange={props.onSelectionChange}
        />
        <div className={style.verticalContainer} style={{ position: 'relative' }}>
          {props.annotation.score.map((score, idx) =>
            <ScoreSelector
              key={`score-${idx}`}
              className={style.flexItem}
              score={score}
              scores={props.scores}
              name={`${idx}`}
              onChange={props.onScoreChange}
              horizontal
            />
          )}
          {props.annotation.score.map((score, idx) =>
            <BGSelector
              key={`bgscore-${idx}`}
              index={idx}
              color={scoreToColor[score]}
            />
          )}
        </div>
      </section>

      <section className={style.lineContainerSpaceBetween}>
        <label className={style.label}>Rationale</label>
        <div>
          <label className={style.label}>Weight</label>
          <input
            className={style.weightInput}
            type="number"
            value={props.annotation.weight}
            min="1"
            max="10"
            name="weight"
            onChange={props.onAnnotationChange}
            onBlur={props.onAnnotationChange}
          />
        </div>
      </section>

      <textarea
        className={style.textBox}
        name="rationale"
        rows="5"
        value={props.annotation.rationale}
        onChange={props.onAnnotationChange}
        onBlur={props.onAnnotationChange}
      />
    </div>);
}

manyScoreAnnotationEditorWidget.propTypes = {
  annotation: React.PropTypes.object,
  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  getLegend: React.PropTypes.func,

  onSelectionChange: React.PropTypes.func,
  onAnnotationChange: React.PropTypes.func,
  onScoreChange: React.PropTypes.func,
};

