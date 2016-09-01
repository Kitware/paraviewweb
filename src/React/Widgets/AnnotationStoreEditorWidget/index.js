import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationStoreEditorWidget.mcss';

import ActionListWidget from '../ActionListWidget';
import AnnotationEditorWidget from '../AnnotationEditorWidget';

function button(label, action) {
  return <div key={label} className={style.button} onClick={action}>{label}</div>;
}

export default function annotationStoreEditorWidget(props) {
  if (!props.annotation || !props.annotations) {
    return null;
  }

  const listAnnotation = Object.keys(props.annotations).map((id, index) =>
    ({
      name: props.annotations[id].name,
      action: `${index}`,
      data: `${id}`,
      active: (props.annotation.id === id),
    }));

  const onActivateAnnotation = (name, action, data) => {
    props.onChange('select', data, props.annotations[data]);
  };

  const storeAction = action => (() => {
    props.onChange(action, props.annotation.id, props.annotation);
  });

  const buttons = [];

  if (props.annotations[props.annotation.id]) {
    const storedSelectedAnnotation = props.annotations[props.annotation.id];
    if (storedSelectedAnnotation.generation === props.annotation.generation) {
      buttons.push(button('Delete', storeAction('delete')));
    } else {
      buttons.push(button('New', storeAction('new')));
      buttons.push(button('Reset', storeAction('reset')));
      buttons.push(button('Save', storeAction('save')));
    }
  } else {
    buttons.push(button('New', storeAction('new')));
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
          />
        </section>
      </div>
      <div className={style.buttonLine}>
        <section className={style.buttonsSection}>
          <div className={style.button} onClick="PushEmpty">Push Empty</div>
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

  onAnnotationChange: React.PropTypes.func,
  onChange: React.PropTypes.func,
};

annotationStoreEditorWidget.defaultProps = {
  onAnnotationChange(annotation, isEditing) {},
  onChange(action, id, annotation) {},
};
