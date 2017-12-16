import React from 'react';
import PropTypes from 'prop-types';
import defaultIcon from '../../../../svg/kitware.svg';

export default function SvgIconWidget(props) {
  const style = Object.assign({}, props.style, {
    width: props.width,
    height: props.height,
  });
  return (
    <svg
      style={style}
      className={props.className}
      onClick={props.onClick}
    >
      <use xlinkHref={props.icon} />
    </svg>);
}

SvgIconWidget.propTypes = {
  className: PropTypes.string,
  height: PropTypes.string,
  icon: PropTypes.string,
  width: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
};

SvgIconWidget.defaultProps = {
  className: '',
  icon: defaultIcon,
  style: {},
};
