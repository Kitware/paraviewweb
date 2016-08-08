import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function oneByTwo(props) {
  return (
    <table className={props.active === '1x2' ? style.activeTable : style.table} name="1x2" onClick={props.onClick}>
      <tbody>
        <tr>
          <td className={props.activeRegion === 0 ? style.activeTd : style.td} />
        </tr>
        <tr>
          <td className={props.activeRegion === 1 ? style.activeTd : style.td} />
        </tr>
      </tbody>
    </table>);
}

oneByTwo.propTypes = {
  onClick: React.PropTypes.func,
  active: React.PropTypes.string,
  activeRegion: React.PropTypes.number,
};

oneByTwo.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
};
