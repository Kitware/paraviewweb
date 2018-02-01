import React from 'react';
import PropTypes from 'prop-types';

// Note the default icon uses the viewBox attribute to create a coordinate system,
// but does not specify height or width attributes on the svg element itself.  This
// allows us to size the icon with the height/width props provided to this component.
// Additionally, not providing any attributes controlling final appearance allows
// external control of those features using CSS.
const defaultIcon =
  '<svg viewBox="0 0 30 30"><path d="m 5 5 l 5 25 l 25 25 l 25 5 z"/></svg>';

function validateSvgString(svgString) {
  // We could do more validation here, but at least make sure we didn't
  // get null, undefined, or the empty string.
  return !!svgString;
}

/* eslint-disable  react/no-danger */
export default function render(props) {
  if (!validateSvgString(props.icon)) {
    console.log(
      `InlineSvgIconWidget won't render, invalid icon property: ${props.icon}`
    );
    return null;
  }

  const style = Object.assign({}, props.style, {
    width: props.width,
    height: props.height,
  });

  return (
    <div
      style={style}
      className={props.className}
      onClick={props.onClick}
      dangerouslySetInnerHTML={{ __html: props.icon }}
    />
  );
}
/* eslint-enable  react/no-danger */

render.propTypes = {
  className: PropTypes.string,
  height: PropTypes.string,
  icon: PropTypes.string,
  width: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
};

render.defaultProps = {
  className: '',
  icon: defaultIcon,
  style: {},
  width: undefined,
  height: undefined,
  onClick: undefined,
};
