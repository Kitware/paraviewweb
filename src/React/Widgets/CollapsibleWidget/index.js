import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/CollapsibleWidget.mcss';

export default class CollapsibleWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
    };

    // Bind callback
    this.toggleOpen = this.toggleOpen.bind(this);
  }

  toggleOpen() {
    if (this.props.disableCollapse && this.state.open) {
      return;
    }
    const newState = !this.state.open;
    this.setState({ open: newState });

    if (this.props.onChange) {
      this.props.onChange(newState);
    }
  }

  isCollapsed() {
    return this.state.open === false;
  }

  isExpanded() {
    return this.state.open === true;
  }

  render() {
    const localStyle = {};
    if (!this.props.visible) {
      localStyle.display = 'none';
    }
    return (
      <section className={style.container} style={localStyle}>
        <div className={style.header}>
          <div onClick={this.toggleOpen}>
            <i className={style[this.state.open ? 'caret' : 'caretClosed']} />
            <strong className={style.title}>{this.props.title}</strong>
          </div>
          <span
            className={
              this.props.activeSubTitle ? style.subtitleActive : style.subtitle
            }
          >
            {this.props.subtitle}
          </span>
        </div>

        <div
          className={
            style[this.state.open ? 'visibleContent' : 'hiddenContent']
          }
        >
          {this.props.children}
        </div>
      </section>
    );
  }
}

CollapsibleWidget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func,
  open: PropTypes.bool,
  subtitle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
  ]),
  title: PropTypes.string,
  visible: PropTypes.bool,
  activeSubTitle: PropTypes.bool,
  disableCollapse: PropTypes.bool,
};

CollapsibleWidget.defaultProps = {
  title: '',
  subtitle: '',
  open: true,
  visible: true,
  disableCollapse: false,
  activeSubTitle: false,

  children: undefined,
  onChange: undefined,
};
