import React     from 'react';
import style     from 'PVWStyle/ReactProperties/PropertyGroup.mcss';
import factory   from '../../Properties/PropertyFactory';

export default function render(props) {
  return (
    <div className={props.show(props.viewData) ? style.container : style.hidden}>
      <div className={style.toolbar} >
        <span className={style.title}>{props.prop.ui.label}</span>
      </div>
      <div className={style.separator} />
      <div className={style.content}>
        {props.prop.children.map(p => factory(p, props.viewData, props.onChange))}
      </div>
    </div>);
}

render.propTypes = {
  show: React.PropTypes.func,
  prop: React.PropTypes.object,
  viewData: React.PropTypes.object,
  onChange: React.PropTypes.func,
};
