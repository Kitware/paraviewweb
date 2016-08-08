import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function twoByOne(props) {
  return (
    <table className={props.active === '2x1' ? style.activeTable : style.table} name="2x1" onClick={props.onClick}>
      <tbody>
        <tr>
          <td className={props.activeRegion === 0 ? style.activeTd : style.td} />
          <td className={props.activeRegion === 1 ? style.activeTd : style.td} />
        </tr>
      </tbody>
    </table>);
}

twoByOne.propTypes = {
  onClick: React.PropTypes.func,
  active: React.PropTypes.string,
  activeRegion: React.PropTypes.number,
};

twoByOne.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
};
