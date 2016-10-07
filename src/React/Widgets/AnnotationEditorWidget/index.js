import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationEditorWidget.mcss';

import OneScore from './OneScore';
import ManyScore from './ManyScore';
import placeHolder from './placeholder-full.png';
import AnnotationBuilder from '../../../Common/Misc/AnnotationBuilder';

const placeholderContainer = (
  <div className={style.placeholderContainer}>
    <div className={style.placeholderTitle}>
      Annotation Editor
    </div>
    <div className={style.placeholderImageContainer}>
      <img src={placeHolder} alt="Placeholder" className={style.placeholderImage} />
    </div>
    <div className={style.placeholderSubtitle}>
      No annotation currently available
    </div>
  </div>);

export default function annotationEditorWidget(props) {
  if (!props.annotation) {
    return placeholderContainer;
  }

  const onSelectionChange = (selection, isEditDone) => {
    const annotation = AnnotationBuilder.update(props.annotation, { selection });

    // Remove score if a divider is removed
    if (selection.type === 'partition' && selection.partition.dividers.length + 1 !== annotation.score.length) {
      let removedIdx = 0;
      props.annotation.selection.partition.dividers.forEach((divider, idx) => {
        if (selection.partition.dividers.indexOf(divider) === -1) {
          removedIdx = idx;
        }
      });
      annotation.score = annotation.score.filter((i, idx) => idx !== removedIdx);
    }

    if (selection.type === 'empty') {
      annotation.score = [];
    }

    props.onChange(annotation, isEditDone);
  };

  const onAnnotationChange = (event) => {
    const value = event.target.value;
    const name = event.target.name;
    const type = event.type;

    if (type === 'blur') {
      const annotation = AnnotationBuilder.update(props.annotation, { [name]: value });
      props.onChange(AnnotationBuilder.markModified(annotation), true);
    } else {
      const annotation = Object.assign({}, props.annotation, { [name]: value });
      props.onChange(annotation, false);
    }
  };

  const onScoreChange = (idx, value) => {
    const score = [].concat(props.annotation.score);
    score[Number(idx)] = value;

    const annotation = Object.assign({}, props.annotation, { score });
    props.onChange(AnnotationBuilder.markModified(annotation), true);
  };

  const Render = props.annotation.selection.type === 'partition' ? ManyScore : OneScore;

  if (props.annotation.selection.type === 'empty') {
    return placeholderContainer;
  }

  return (
    <div className={props.annotation && props.annotation.readOnly ? style.disabledTopContainer : style.topContainer}>
      <Render
        {...props}
        onSelectionChange={onSelectionChange}
        onAnnotationChange={onAnnotationChange}
        onScoreChange={onScoreChange}
      />
    </div>);
}

annotationEditorWidget.propTypes = {
  annotation: React.PropTypes.object,
  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  onChange: React.PropTypes.func,
  getLegend: React.PropTypes.func,
  rationaleOpen: React.PropTypes.bool,
};

annotationEditorWidget.defaultProps = {
  onChange(annotation, isEditDone) {},
  rationaleOpen: false,
};
