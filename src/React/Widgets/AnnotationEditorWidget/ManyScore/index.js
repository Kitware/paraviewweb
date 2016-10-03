import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

import CollapsibleWidget from '../../CollapsibleWidget';

import ScoreSelector from '../ScoreSelector';
import BGSelector from '../BackgroundScore';
import SelectionEditorWidget from '../../SelectionEditorWidget';

export default function manyScoreAnnotationEditorWidget(props) {
  return (
    <div className={style.verticalContainer}>
      <section className={style.lineContainer}>
        <label className={style.nameLabel}>Name</label>
        <input
          type="text"
          name="name"
          className={style.nameInput}
          value={props.annotation.name}
          onChange={props.onAnnotationChange}
          onBlur={props.onAnnotationChange}
        />
      </section>
      <section className={style.lineContainerCenter}>
        <SelectionEditorWidget
          className={style.flexItem}
          selection={props.annotation.selection}
          ranges={props.ranges}
          getLegend={props.getLegend}
          onChange={props.onSelectionChange}
        >
          {props.annotation.score.map((score, idx, array) =>
            <BGSelector
              key={`bgscore-${idx}`}
              index={idx}
              fullHeight={array.length === 1}
              color={props.scores[score].color}
            />
          )}
        </SelectionEditorWidget>
        <div className={style.verticalContainer} style={{ position: 'relative', zIndex: 0 }}>
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
        </div>
      </section>

      <section className={style.lineContainerSpaceBetween}>
        <label className={style.label} />
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

      <section className={style.lineContainerSpaceBetween}>
        <CollapsibleWidget title="Rationale" open={props.rationaleOpen}>
          <textarea
            className={style.textBox}
            name="rationale"
            rows="5"
            value={props.annotation.rationale}
            onChange={props.onAnnotationChange}
            onBlur={props.onAnnotationChange}
          />
        </CollapsibleWidget>
      </section>
    </div>);
}

manyScoreAnnotationEditorWidget.propTypes = {
  annotation: React.PropTypes.object,
  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  getLegend: React.PropTypes.func,
  rationaleOpen: React.PropTypes.bool,

  onSelectionChange: React.PropTypes.func,
  onAnnotationChange: React.PropTypes.func,
  onScoreChange: React.PropTypes.func,
};

manyScoreAnnotationEditorWidget.defaultProps = {
  rationaleOpen: false,
};
