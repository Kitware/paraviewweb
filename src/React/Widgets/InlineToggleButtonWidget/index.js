import React from 'react';
import PropTypes from 'prop-types';

import equals from 'mout/src/object/equals';

import style from 'PVWStyle/ReactWidgets/InlineToggleButtonWidget.mcss';

export default class InlineToggleButtonWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIdx: props.active || 0,
    };

    // Bind callback
    this.activateButton = this.activateButton.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const previous = this.props;
    const next = nextProps;

    if (!equals(previous, next)) {
      this.setState({
        activeIdx: next.active || 0,
      });
    }
  }

  activateButton(e) {
    const activeIdx = Number(e.target.dataset.idx);
    this.setState({ activeIdx });
    if (this.props.onChange) {
      this.props.onChange(this.props.options[activeIdx], activeIdx);
    }
  }

  render() {
    const currentActive = this.state.activeIdx;
    const fontSize = this.props.height;
    const lineHeight = this.props.height;
    const height = this.props.height;

    return (
      <div className={style.container}>
        {this.props.options.map((obj, idx) => {
          const isActive = currentActive === idx;
          const background = isActive
            ? this.props.activeColor
            : this.props.defaultColor;
          const className =
            idx === 0
              ? isActive ? 'activeFirst' : 'first'
              : idx === this.props.options.length - 1
                ? isActive ? 'activeLast' : 'last'
                : isActive ? 'activeMiddle' : 'middle';
          if (obj.label) {
            return (
              <button
                style={{ lineHeight, fontSize, background }}
                key={idx}
                onClick={this.activateButton}
                data-idx={idx}
                className={style[className]}
              >
                {obj.label}
              </button>
            );
          }
          if (obj.img) {
            return (
              <div
                style={{ lineHeight, height, fontSize, background }}
                key={idx}
                onClick={this.activateButton}
                data-idx={idx}
                className={style[className]}
              >
                <img
                  data-idx={idx}
                  onClick={this.activateButton}
                  height="100%"
                  src={obj.img}
                  alt="ToggleButton"
                />
              </div>
            );
          }
          if (obj.icon) {
            return (
              <i
                key={idx}
                style={{ lineHeight, fontSize, background }}
                onClick={this.activateButton}
                data-idx={idx}
                className={[style[className], obj.icon].join(' ')}
              />
            );
          }
          return null;
        })}
      </div>
    );
  }
}

InlineToggleButtonWidget.propTypes = {
  active: PropTypes.number,
  activeColor: PropTypes.string,
  defaultColor: PropTypes.string,
  height: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array.isRequired,
};

InlineToggleButtonWidget.defaultProps = {
  activeColor: '#fff',
  defaultColor: '#ccc',
  height: '1em',
  onChange: undefined,
  active: 0,
};
