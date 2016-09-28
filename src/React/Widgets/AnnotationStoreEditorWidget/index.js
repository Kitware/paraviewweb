import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationStoreEditorWidget.mcss';

import ActionListWidget from '../ActionListWidget';
import AnnotationEditorWidget from '../AnnotationEditorWidget';

function button(label, action) {
  return <div key={label} className={style.button} onClick={action}>{label}</div>;
}

export default function annotationStoreEditorWidget(props) {
  if (!props.annotations) {
    return null;
  }

  const listAnnotation = Object.keys(props.annotations).map((id, index) =>
    ({
      name: props.annotations[id].name,
      action: `${index}`,
      data: `${id}`,
      active: props.annotation ? (props.annotation.id === id) : false,
    }));

  const onActivateAnnotation = (name, action, data) => {
    props.onChange('select', data, props.annotations[data]);
  };

  const storeAction = action => (() => {
    props.onChange(action, props.annotation.id, props.annotation);
  });

  const buttons = [];

  if (props.annotation && props.annotations[props.annotation.id]) {
    const storedSelectedAnnotation = props.annotations[props.annotation.id];
    if (storedSelectedAnnotation.generation === props.annotation.generation) {
      buttons.push(button('Delete', storeAction('delete')));
    } else {
      buttons.push(button('Save as new', storeAction('new')));
      buttons.push(button('Revert', storeAction('reset')));
      buttons.push(button('Update', storeAction('save')));
    }
  } else if (props.annotation && props.annotation.selection.type !== 'empty' && !props.annotation.readOnly) {
    buttons.push(button('Save', storeAction('new')));
  }

  return (
    <div className={style.container}>
      <div className={style.topLine}>
        <section className={style.list}>
          <ActionListWidget list={listAnnotation} onClick={onActivateAnnotation} />
        </section>
        <section className={style.editor}>
          <AnnotationEditorWidget
            annotation={props.annotation}
            scores={props.scores}
            ranges={props.ranges}
            getLegend={props.getLegend}
            onChange={props.onAnnotationChange}
            rationaleOpen={props.rationaleOpen}
          />
        </section>
      </div>
      <div className={style.buttonLine}>
        <section className={style.buttonsSection}>
          <div className={style.button} onClick={() => props.onChange('pushEmpty')}>Reset</div>
        </section>
        <section className={style.buttonsSection}>
          {buttons}
        </section>
      </div>
    </div>);
}

annotationStoreEditorWidget.propTypes = {
  annotation: React.PropTypes.object,
  annotations: React.PropTypes.object,

  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  getLegend: React.PropTypes.func,
  rationaleOpen: React.PropTypes.bool,

  onAnnotationChange: React.PropTypes.func,
  onChange: React.PropTypes.func,
};

annotationStoreEditorWidget.defaultProps = {
  onAnnotationChange(annotation, isEditing) {},
  onChange(action, id, annotation) {},
  rationaleOpen: false,
};
