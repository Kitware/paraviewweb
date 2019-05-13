import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/PropertyGroup.mcss';
import factory from '../PropertyFactory';

export default function render(props) {
  return (
    <div
      className={props.show(props.viewData) ? style.container : style.hidden}
    >
      <div className={style.toolbar}>
        <span className={style.title}>{props.prop.ui.label}</span>
      </div>
      <div className={style.separator} />
      <div className={style.content}>
        {props.prop.children.map((p) =>
          factory(p, props.viewData, props.onChange)
        )}
      </div>
    </div>
  );
}

render.propTypes = {
  show: PropTypes.func.isRequired,
  prop: PropTypes.object.isRequired,
  viewData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
