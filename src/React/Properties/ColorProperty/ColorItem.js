import React from 'react';
import PropTypes from 'prop-types';

export default function ColorItem(props) {
  const background =
    props.color.length === 3
      ? `rgb(${Math.floor(props.color[0] * 255)}, ${Math.floor(
          props.color[1] * 255
        )}, ${Math.floor(props.color[2] * 255)})`
      : `rgba(${Math.floor(props.color[0] * 255)}, ${Math.floor(
          props.color[1] * 255
        )}, ${Math.floor(props.color[2] * 255)}, ${Math.floor(
          props.color[3]
        )})`;
  const text = props.color.length === 4 ? 'X' : '';
  const borderRadius = props.active ? '2px' : '50%';
  const border = props.active ? 'solid 2px black' : `solid 2px ${background}`;
  return (
    <div
      data-color={props.color.join(',')}
      style={Object.assign({ background, border, borderRadius }, props.style)}
      onClick={props.onClick}
    >
      {text}
    </div>
  );
}

ColorItem.propTypes = {
  color: PropTypes.array,
  onClick: PropTypes.func,
  style: PropTypes.object,
  active: PropTypes.bool,
};

ColorItem.defaultProps = {
  active: false,
  color: [0.5, 0.5, 0.5],
  onClick: () => {},
  style: {
    margin: '4px',
    width: '20px',
    height: '20px',
    flex: 'none',
    textAlign: 'center',
    lineHeight: '20px',
    cursor: 'pointer',
  },
};
