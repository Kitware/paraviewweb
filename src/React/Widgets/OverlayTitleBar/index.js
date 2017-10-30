import React from 'react';
import style from 'PVWStyle/ReactWidgets/OverlayTitleBar.mcss';

export default function overlayTitleBar(props) {
  return (
    <div>
      <span className={style.overlayTitle}>{props.title}</span>
      <button className={style.closeControlBtn} name={props.name} onClick={props.onClose} />
    </div>);
}

overlayTitleBar.propTypes = {
  title: React.PropTypes.string,
  name: React.PropTypes.string,
  onClose: React.PropTypes.func,
};

overlayTitleBar.defaultProps = {
  title: 'Your title here',
  name: 'Overlay name',
};
