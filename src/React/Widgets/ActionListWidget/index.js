import React from 'react';
import style from 'PVWStyle/ReactWidgets/ActionListWidget.mcss';

export default React.createClass({

  displayName: 'ActionListWidget',

  propTypes: {
    list: React.PropTypes.array.isRequired,
    onClick: React.PropTypes.func,
  },

  processClick(event) {
    var target = event.target;
    while (!target.dataset.name) {
      target = target.parentNode;
    }

    if (this.props.onClick) {
      this.props.onClick(target.dataset.name, target.dataset.action, target.dataset.user);
    }
  },

  render() {
    var list = [];

    this.props.list.forEach((item, idx) => {
      list.push(
        <li
          className={item.active ? style.activeItem : style.item}
          key={idx}
          title={item.name}
          data-name={item.name}
          data-action={item.action || 'default'}
          data-user={item.data || ''}
          onClick={this.processClick}
        >
          <i className={item.icon} />{item.name}
        </li>);
    });

    return <ul className={style.list}>{list}</ul>;
  },
});
