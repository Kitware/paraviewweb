import React from 'react';
import PropTypes from 'prop-types';

import WidgetTypes from './types';

export default function render(props) {
  const SelectionWidget = WidgetTypes[props.selection ? props.selection.type : 'empty'];
  return <SelectionWidget {...props} />;
}

render.propTypes = {
  selection: PropTypes.object,
  ranges: PropTypes.object,
  onChange: PropTypes.func,
  getLegend: PropTypes.func,
  className: PropTypes.string,
};

render.defaultProps = {
  onChange(selection, isEditDone) {},
};
