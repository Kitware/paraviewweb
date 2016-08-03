import React from 'react';
import SvgIconWidget from '../SvgIconWidget';

export default function legendIcon(props) {
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

legendIcon.propTypes = {
  name: React.PropTypes.string,
  getLegend: React.PropTypes.func,

  width: React.PropTypes.string,
  height: React.PropTypes.string,
  style: React.PropTypes.object,

  onClick: React.PropTypes.func,
};
