import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function twoLeft(props) {
  return (
    <table className={props.active === '3xL' ? style.activeTable : style.table} name="3xL" onClick={props.onClick}>
      <tbody>
        <tr>
          <td rowSpan="2" className={props.activeRegion === 0 ? style.activeTd : style.td} />
          <td className={props.activeRegion === 1 ? style.activeTd : style.td} />
        </tr>
        <tr>
          <td className={props.activeRegion === 2 ? style.activeTd : style.td} />
        </tr>
      </tbody>
    </table>);
}

twoLeft.propTypes = {
  onClick: React.PropTypes.func,
  active: React.PropTypes.string,
  activeRegion: React.PropTypes.number,
};

twoLeft.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
};
