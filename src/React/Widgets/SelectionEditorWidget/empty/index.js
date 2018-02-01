import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export default function render(props) {
  return (
    <div className={[style.emptySelection, props.className].join(' ')}>
      No selection
    </div>
  );
}

render.propTypes = {
  className: PropTypes.string,
};

render.defaultProps = {
  className: '',
};
