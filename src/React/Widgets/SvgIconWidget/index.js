import React       from 'react';
import defaultIcon from '../../../../svg/kitware.svg';

export default React.createClass({

  displayName: 'SvgIconWidget',

  propTypes: {
    className: React.PropTypes.string,
    height: React.PropTypes.string,
    icon: React.PropTypes.string,
    width: React.PropTypes.string,
    style: React.PropTypes.object,
    onClick: React.PropTypes.func,
  },

  getDefaultProps() {
    return {
      className: '',
      icon: defaultIcon,
      style: {},
    };
  },

  render() {
    const style = Object.assign({}, this.props.style, {
      width: this.props.width,
      height: this.props.height,
    });
    return (
      <svg
        style={style}
        className={this.props.className}
        onClick={this.props.onClick}
      >
        <use xlinkHref={this.props.icon} />
      </svg>);
  },
});
