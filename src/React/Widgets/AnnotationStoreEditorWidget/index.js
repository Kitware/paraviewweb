import React from 'react';

import style from 'PVWStyle/ReactWidgets/AnnotationStoreEditorWidget.mcss';

import ActionListWidget from '../ActionListWidget';
import AnnotationEditorWidget from '../AnnotationEditorWidget';
import ToggleIconButtonWidget from '..//ToggleIconButtonWidget';

function button(label, action) {
  return <div key={label} className={style.button} onClick={action}>{label}</div>;
}

export default function annotationStoreEditorWidget(props) {
  if (!props.annotation || !props.annotations) {
    return null;
  }

  const listAnnotation = Object.keys(props.annotations).map((name, index) =>
    ({
      name,
      action: `${index}`,
      data: `${name}`,
      active: (props.annotation.id === props.annotations[name].id),
    }));

  const onActivateAnnotation = (name, action, data) => {
    props.onChange('select', name, props.annotations[name]);
  };

  const storeAction = name => (() => props.onChange(name, props.title, props.annotation));

  const buttons = [];
  if (props.isLinked) {
    buttons.push(button('Delete', storeAction('delete')));
    buttons.push(button('Save', storeAction('save')));
  } else {
    buttons.push(button('New', storeAction('new')));
  }

  return (
    <div className={style.container}>
      <section className={style.list}>
        <ActionListWidget list={listAnnotation} onClick={onActivateAnnotation} />
      </section>
      <div className={style.formContent}>
        <section className={style.formLine}>
          <label className={style.label}>Title</label>
          <ToggleIconButtonWidget
            icon={props.isLinked ? style.linkedIcon : style.unlinkedIcon}
            value={props.isLinked}
            onChange={props.onLinkChange}
          />
        </section>
        <section className={style.formLine}>
          <input
            type="text"
            name="title"
            className={style.input}
            value={props.title}
            onChange={e => props.onTitleChange(e.target.value)}
          />
        </section>
        <AnnotationEditorWidget
          annotation={props.annotation}
          scores={props.scores}
          ranges={props.ranges}
          getLegend={props.getLegend}
          onChange={props.onAnnotationChange}
        />
        <section className={style.formButtons}>
          {buttons}
        </section>
      </div>
    </div>);
}

annotationStoreEditorWidget.propTypes = {
  title: React.PropTypes.string,
  annotation: React.PropTypes.object,
  annotations: React.PropTypes.object,
  isLinked: React.PropTypes.bool,

  scores: React.PropTypes.array,
  ranges: React.PropTypes.object,
  getLegend: React.PropTypes.func,

  onAnnotationChange: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onTitleChange: React.PropTypes.func,
  onLinkChange: React.PropTypes.func,
};

annotationStoreEditorWidget.defaultProps = {
  onAnnotationChange(annotation, isEditing) {},
  onChange(action, name, annotation) {},
  onTitleChange(newTitle) {},
  onLinkChange() {},
};
