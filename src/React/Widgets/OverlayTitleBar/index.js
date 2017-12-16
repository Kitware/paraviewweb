import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/OverlayTitleBar.mcss';

export default function overlayTitleBar(props) {
  return (
    <div>
      <span className={style.overlayTitle}>{props.title}</span>
      <button className={style.closeControlBtn} name={props.name} onClick={props.onClose} />
    </div>);
}

overlayTitleBar.propTypes = {
  title: PropTypes.string,
  name: PropTypes.string,
  onClose: PropTypes.func,
};

overlayTitleBar.defaultProps = {
  title: 'Your title here',
  name: 'Overlay name',
};
