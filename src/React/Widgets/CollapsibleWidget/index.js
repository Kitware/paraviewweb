import React from 'react';
import style from 'PVWStyle/ReactWidgets/CollapsibleWidget.mcss';

export default React.createClass({

  displayName: 'CollapsibleWidget',

  propTypes: {
    children: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.array]),
    onChange: React.PropTypes.func,
    open: React.PropTypes.bool,
    subtitle: React.PropTypes.oneOfType([React.PropTypes.object, React.PropTypes.string, React.PropTypes.array]),
    title: React.PropTypes.string,
    visible: React.PropTypes.bool,
    activeSubTitle: React.PropTypes.bool,
    disableCollapse: React.PropTypes.bool,
  },

  getDefaultProps() {
    return {
      title: '',
      subtitle: '',
      open: true,
      visible: true,
      disableCollapse: false,
    };
  },

  getInitialState() {
    return {
      open: this.props.open,
    };
  },

  toggleOpen() {
    if (this.props.disableCollapse && this.state.open) {
      return;
    }
    const newState = !this.state.open;
    this.setState({ open: newState });

    if (this.props.onChange) {
      this.props.onChange(newState);
    }
  },

  isCollapsed() {
    return this.state.open === false;
  },

  isExpanded() {
    return this.state.open === true;
  },

  render() {
    var localStyle = {};
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
          <span className={this.props.activeSubTitle ? style.subtitleActive : style.subtitle}>{this.props.subtitle}</span>
        </div>

        <div className={style[this.state.open ? 'visibleContent' : 'hiddenContent']}>
          {this.props.children}
        </div>
      </section>
    );
  },
});
