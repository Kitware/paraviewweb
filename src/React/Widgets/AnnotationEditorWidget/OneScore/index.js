import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

import ScoreSelector from '../ScoreSelector';
import SelectionEditorWidget from '../../SelectionEditorWidget';

export default function oneScoreAnnotationEditorWidget(props) {
  return (
    <div className={style.verticalContainer}>
      <SelectionEditorWidget
        className={style.flexItem}
        selection={props.annotation.selection}
        ranges={props.ranges}
        getLegend={props.getLegend}
        onChange={props.onSelectionChange}
      />

      <section className={style.lineContainerSpaceBetween}>
        <section className={style.lineContainer}>
          <label className={style.label}>Score</label>
          <ScoreSelector
            score={props.annotation.score[0]}
            scores={props.scores}
            name="0"
            onChange={props.onScoreChange}
            horizontal
          />
        </section>
        <section>
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
        </section>
      </section>

      <section className={style.lineContainerSpaceBetween}>
        <label className={style.label}>Rationale</label>
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

oneScoreAnnotationEditorWidget.propTypes = {
  annotation: React.PropTypes.object,
  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  getLegend: React.PropTypes.func,

  onSelectionChange: React.PropTypes.func,
  onAnnotationChange: React.PropTypes.func,
  onScoreChange: React.PropTypes.func,
};
