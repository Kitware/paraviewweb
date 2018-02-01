import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ButtonSelectorWidget.mcss';

export default class ButtonSelectorWidget extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.processItem = this.processItem.bind(this);
  }

  processItem(event) {
    const name = event.target.name;
    const array = this.props.list;
    let count = array.length;

    if (this.props.onChange) {
      while (count) {
        count -= 1;
        if (array[count].name === name) {
          this.props.onChange(count, array);
        }
      }
    }
  }

  render() {
    const list = [];

    this.props.list.forEach((item) => {
      list.push(
        <button
          className={style.button}
          key={item.name}
          name={item.name}
          onClick={this.processItem}
        >
          {item.name}
        </button>
      );
    });

    return <section className={style.container}>{list}</section>;
  }
}

ButtonSelectorWidget.propTypes = {
  list: PropTypes.array.isRequired,
  onChange: PropTypes.func,
};

ButtonSelectorWidget.defaultProps = {
  onChange: undefined,
};
