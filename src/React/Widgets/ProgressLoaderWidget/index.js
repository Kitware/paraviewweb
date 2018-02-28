import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ProgressLoaderWidget.mcss';

export default function ProgressLoaderWidget(props) {
  return (
    <div className={style.container}>
      <div className={style.loader} />
      <div className={style.message}>{props.message}</div>
    </div>
  );
}

ProgressLoaderWidget.propTypes = {
  message: PropTypes.string,
};

ProgressLoaderWidget.defaultProps = {
  message: 'Loading ParaView...',
};
