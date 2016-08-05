import React from 'react';
import WidgetTypes from './types';

export default function selectionEditorWidget(props) {
  const SelectionWidget = WidgetTypes[props.selection ? props.selection.type : 'empty'];
  return <SelectionWidget {...props} />;
}

selectionEditorWidget.propTypes = {
  selection: React.PropTypes.object,
  ranges: React.PropTypes.object,
  onChange: React.PropTypes.func,
  getLegend: React.PropTypes.func,
  className: React.PropTypes.string,
};

selectionEditorWidget.defaultProps = {
  onChange(selection, isEditDone) {},
};
