import React from 'react';
import LayoutsWidget from '../../../React/Widgets/LayoutsWidget';

import TwoByTwo  from '../../../React/Widgets/LayoutsWidget/TwoByTwo';
import OneByTwo  from '../../../React/Widgets/LayoutsWidget/OneByTwo';
import TwoByOne  from '../../../React/Widgets/LayoutsWidget/TwoByOne';
import OneByOne  from '../../../React/Widgets/LayoutsWidget/OneByOne';
import TwoLeft   from '../../../React/Widgets/LayoutsWidget/TwoLeft';
import TwoTop    from '../../../React/Widgets/LayoutsWidget/TwoTop';
import TwoRight  from '../../../React/Widgets/LayoutsWidget/TwoRight';
import TwoBottom from '../../../React/Widgets/LayoutsWidget/TwoBottom';

import style from 'PVWStyle/ComponentReact/WorkbenchController.mcss';

const LAYOUT_VIEW = {
  '2x2': TwoByTwo,
  '1x2': OneByTwo,
  '2x1': TwoByOne,
  '1x1': OneByOne,
  '3xL': TwoLeft,
  '3xT': TwoTop,
  '3xR': TwoRight,
  '3xB': TwoBottom,
};

export default function workbenchController(props) {
  const options = Object.keys(props.viewports).map((name, idx) => <option key={idx} value={name}>{name}</option>);
  const mapping = [];
  while (mapping.length < props.count) {
    mapping.push('None');
  }
  Object.keys(props.viewports).forEach(name => {
    if (props.viewports[name].viewport !== -1) {
      mapping[props.viewports[name].viewport] = name;
    }
  });
  while (mapping.length > props.count) {
    mapping.pop();
  }

  function changeViewport(event) {
    const idx = Number(event.currentTarget.getAttribute('name'));
    const name = event.currentTarget.value;
    props.onViewportChange(idx, props.viewports[name].component);
  }
  const LayoutItem = LAYOUT_VIEW[props.activeLayout];

  return (
    <div className={style.container}>
      <LayoutsWidget className={style.layout} onChange={props.onLayoutChange} active={props.activeLayout} />
      {mapping.map((name, idx) => (
        <section key={idx} className={style.line}>
          <LayoutItem activeRegion={idx} />
          <select className={style.stretch} name={idx} value={name} onChange={changeViewport} >
            {options}
          </select>
        </section>)
      )}
    </div>
    );
}

workbenchController.propTypes = {
  onLayoutChange: React.PropTypes.func,
  onViewportChange: React.PropTypes.func,
  activeLayout: React.PropTypes.string,
  viewports: React.PropTypes.object,
  count: React.PropTypes.number,
};

workbenchController.defaultProps = {
  onLayoutChange: () => {},
  onViewportChange: () => {},
  count: 4,
};
