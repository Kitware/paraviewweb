import React from 'react';
import PropTypes from 'prop-types';

import SvgIconWidget from '../SvgIconWidget';

export default function render(props) {
  if (!props.getLegend) {
    return <span>{props.name}</span>;
  }
  const style = { fill: props.getLegend(props.name).color };
  const newStyle = Object.assign({ stroke: 'black', strokeWidth: 1 }, style, props.style);

  return (
    <SvgIconWidget
      icon={props.getLegend(props.name).shape}

      width={props.width}
      height={props.height}
      style={newStyle}

      onClick={props.onClick}
    />);
}

render.propTypes = {
  name: PropTypes.string,
  getLegend: PropTypes.func,

  width: PropTypes.string,
  height: PropTypes.string,
  style: PropTypes.object,

  onClick: PropTypes.func,
};
