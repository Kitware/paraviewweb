import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/CollapsiblePropertyGroup.mcss';
import factory from '../../Properties/PropertyFactory';

export default function render(props) {
  const isCollapsed = !props.prop.data.value[0];
  const id = props.prop.data.id;

  return (
    <div
      className={props.show(props.viewData) ? style.container : style.hidden}
    >
      <div
        className={style.toolbar}
        onClick={() =>
          props.onChange({
            collapseType: 'ProxyEditorPropertyWidget',
            id,
            value: !isCollapsed,
          })
        }
      >
        <i className={isCollapsed ? style.collapsedIcon : style.expandedIcon} />
        <span className={style.title}>{props.prop.ui.label}</span>
      </div>
      <div className={isCollapsed ? style.hidden : style.content}>
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
