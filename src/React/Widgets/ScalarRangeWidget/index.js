import React from 'react';
import style from 'PVWStyle/ReactWidgets/ScalarRangeWidget.mcss';

export default React.createClass({

  displayName: 'ScalarRangeWidget',

  propTypes: {
    max: React.PropTypes.number,
    min: React.PropTypes.number,
    onApply: React.PropTypes.func,
    visible: React.PropTypes.bool,
  },

  getInitialState() {
    return {
      max: this.props.max || 1,
      min: this.props.min || 0,
    };
  },

  componentWillReceiveProps(nextProps) {
    const { min, max } = nextProps;
    if (this.state.min !== min || this.state.max !== max) {
      this.setState({ min, max });
    }
  },

  updateRange(event) {
    const name = event.target.name,
      value = event.target.value;

    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      this.setState({ [name]: value });
    }
  },

  apply(event) {
    var { min, max } = this.state;
    const type = event.target.dataset.type;

    min = Number(min);
    max = Number(max);

    if (this.props.onApply) {
      this.props.onApply({ type, min, max });
    }
  },

  render() {
    if (!this.props.visible) {
      return null;
    }

    return (
      <div className={style.container}>
        <input
          className={style.rangeInput}
          type="text"
          pattern="-*[0-9]*.*[0-9]*"
          name="min"
          value={this.state.min}
          onChange={this.updateRange}
        />
        <input
          className={style.rangeInput}
          type="text"
          pattern="-*[0-9]*.*[0-9]*"
          name="max"
          value={this.state.max}
          onChange={this.updateRange}
        />
        <div className={style.actionLine}>
          <i onClick={this.apply} data-type="data" className={style.dataRangeIcon} />
          <i onClick={this.apply} data-type="time" className={style.timeRangeIcon} />
          <i onClick={this.apply} data-type="custom" className={style.customRangeIcon} />
        </div>
      </div>);
  },
});
