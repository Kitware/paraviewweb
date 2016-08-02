import React from 'react';
import SvgIconWidget from '../SvgIconWidget';

export default function LegendIcon(props) {
  if (!props.provider || !props.provider.isA('LegendProvider')) {
    return <span>{ props.name }</span>;
  }
  const style = { fill: props.provider.getLegend(props.name).color };
  const newStyle = Object.assign({ stroke: 'black', strokeWidth: 1 }, style, props.style);

  return (<SvgIconWidget
          style={newStyle}
          width={props.width} height={props.height}
          icon={props.provider.getLegend(props.name).shape}
          onClick={props.onClick}
        />);
}

LegendIcon.propTypes = {
  provider: React.PropTypes.object,
  style: React.PropTypes.object,
  name: React.PropTypes.string,
  height: React.PropTypes.string,
  width: React.PropTypes.string,
  onClick: React.PropTypes.func,
};
