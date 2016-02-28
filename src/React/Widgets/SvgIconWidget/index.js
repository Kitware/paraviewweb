import React       from 'react';
import defaultIcon from '../../../../svg/kitware.svg';

export default React.createClass({

  displayName: 'SvgIconWidget',

  propTypes: {
    className: React.PropTypes.string,
    height: React.PropTypes.string,
    icon: React.PropTypes.string,
    width: React.PropTypes.string,
  },

  getDefaultProps() {
      return {
          className: '',
          icon: defaultIcon,
      };
  },

  /* eslint-disable react/no-danger */
  render() {
    const style = {
      width: this.props.width,
      height: this.props.height,
    };
    return (
      <svg
        style={style}
        className={ this.props.className }
        dangerouslySetInnerHTML={{
          __html: `<use xlink:href="${this.props.icon}"></use>`,
        }}/>
    );
  },
  /* eslint-enable react/no-danger */
});
