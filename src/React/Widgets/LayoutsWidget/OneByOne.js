import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default function render(props) {
  return (
    <table
      className={props.active === '1x1' ? style.activeTable : style.table}
      name="1x1"
      onClick={props.onClick}
    >
      <tbody>
        <tr>
          <td
            className={props.activeRegion === 0 ? style.activeTd : style.td}
          />
        </tr>
      </tbody>
    </table>
  );
}

render.propTypes = {
  onClick: PropTypes.func,
  active: PropTypes.string,
  activeRegion: PropTypes.number,
};

render.defaultProps = {
  onClick: () => {},
  activeRegion: -1,
  active: undefined,
};
