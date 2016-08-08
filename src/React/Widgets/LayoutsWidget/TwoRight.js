import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function twoRight(props) {
  return (
    <table className={props.active === '3xR' ? style.activeTable : style.table} name="3xR" onClick={props.onClick}>
      <tbody>
        <tr>
          <td className={props.activeRegion === 0 ? style.activeTd : style.td} />
          <td rowSpan="2" className={props.activeRegion === 1 ? style.activeTd : style.td} />
        </tr>
        <tr>
          <td className={props.activeRegion === 2 ? style.activeTd : style.td} />
        </tr>
      </tbody>
    </table>);
}

twoRight.propTypes = {
  onClick: React.PropTypes.func,
  active: React.PropTypes.string,
  activeRegion: React.PropTypes.number,
};

twoRight.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
};
