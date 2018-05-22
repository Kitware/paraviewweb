import React from 'react';
import PropTypes from 'prop-types';
import defaultIcon from '../../../../svg/kitware.svg';

export default function SvgIconWidget(props) {
  const { id, viewBox } = props.icon || {};
  let xlink = id || props.icon;
  if (xlink[0] !== '#') {
    xlink = `#${xlink}`;
  }
  const style = Object.assign({}, props.style, {
    width: props.width,
    height: props.height,
  });
  return (
    <svg
      viewBox={viewBox || props.viewBox}
      style={style}
      className={props.className}
      onClick={props.onClick}
    >
      <use xlinkHref={xlink} />
    </svg>
  );
}

SvgIconWidget.propTypes = {
  className: PropTypes.string,
  height: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  width: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  viewBox: PropTypes.string,
};

SvgIconWidget.defaultProps = {
  className: '',
  icon: defaultIcon,
  style: {},
  height: undefined,
  width: undefined,
  onClick: undefined,
  viewBox: '0 0 20 20',
};
