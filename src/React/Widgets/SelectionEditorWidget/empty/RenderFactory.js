import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export function render(selection, props, onChange = null, onDelete = null) {
  return <div className={style.emptySelection}>No selection</div>;
}

export default { render };
