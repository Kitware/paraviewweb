import React from 'react';
import PropTypes from 'prop-types';

import NumberSliderControl from '../../Widgets/NumberSliderWidget';

export default class Slider extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.valueChange = this.valueChange.bind(this);
  }

  valueChange(e) {
    if (this.props.onChange) {
      if (this.props.idx >= 0) {
        this.props.onChange(this.props.idx, e.target.value);
      } else {
        this.props.onChange(null, e.target.value);
      }
    }
  }

  render() {
    const propsCopy = Object.assign({}, this.props);
    delete propsCopy.onChange;
    delete propsCopy.idx;

    return <NumberSliderControl {...propsCopy} onChange={this.valueChange} />;
  }
}

Slider.propTypes = {
  idx: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

Slider.defaultProps = {
  idx: -1,
};
