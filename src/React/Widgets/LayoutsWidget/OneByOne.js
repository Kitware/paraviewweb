import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function oneByOne(props) {
  return (
    <table className={props.active === '1x1' ? style.activeTable : style.table} name="1x1" onClick={props.onClick}>
      <tbody>
        <tr>
          <td className={props.activeRegion === 0 ? style.activeTd : style.td} />
        </tr>
      </tbody>
    </table>);
}

oneByOne.propTypes = {
  onClick: React.PropTypes.func,
  active: React.PropTypes.string,
  activeRegion: React.PropTypes.number,
};

oneByOne.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
};
