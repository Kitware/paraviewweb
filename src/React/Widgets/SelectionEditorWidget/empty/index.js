import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export default function emptySelection(selection, props, onChange = null, onDelete = null) {
  return <div className={style.emptySelection}>No selection</div>;
}
