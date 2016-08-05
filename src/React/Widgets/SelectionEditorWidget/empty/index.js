import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export default function emptySelection(props) {
  return <div className={[style.emptySelection, props.className].join(' ')}>No selection</div>;
}

emptySelection.propTypes = {
  className: React.PropTypes.string,
};
