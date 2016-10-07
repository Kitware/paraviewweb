import React from 'react';
import style from 'PVWStyle/ReactWidgets/ButtonSelectorWidget.mcss';

export default React.createClass({

  displayName: 'ButtonSelectorWidget',

  propTypes: {
    list: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func,
  },

  processItem(event) {
    var name = event.target.name,
      array = this.props.list,
      count = array.length;

    if (this.props.onChange) {
      while (count) {
        count -= 1;
        if (array[count].name === name) {
          this.props.onChange(count, array);
        }
      }
    }
  },

  render() {
    var list = [];

    this.props.list.forEach((item) => {
      list.push(<button className={style.button} key={item.name} name={item.name} onClick={this.processItem}>{item.name}</button>);
    });

    return <section className={style.container}>{list}</section>;
  },
});
