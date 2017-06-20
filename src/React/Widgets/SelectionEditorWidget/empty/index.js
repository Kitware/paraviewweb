import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export default function render(props) {
  return <div className={[style.emptySelection, props.className].join(' ')}>No selection</div>;
}

render.propTypes = {
  className: React.PropTypes.string,
};
