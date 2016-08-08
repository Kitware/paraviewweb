import React                    from 'react';

import style                    from 'PVWStyle/ReactWidgets/QueryDataModelWidget.mcss';

import DataListenerMixin        from './DataListenerMixin';
import DataListenerUpdateMixin  from './DataListenerUpdateMixin';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a QueryDataModel instance.
 *   - listener:
 *       Expect a Boolean based on the automatic data model registration for listening.
 *       Default value is true but that should be false is nested.
 *   - arg:
 *       Expect the name of the argument this Number UI element control within the model.
 */
export default React.createClass({

  displayName: 'Number',

  propTypes: {
    arg: React.PropTypes.string,
    model: React.PropTypes.object.isRequired,
  },

  mixins: [DataListenerMixin, DataListenerUpdateMixin],

  getInitialState() {
    return {
      advanced: false,
      button: false,
      slider: false,
    };
  },

  onIndexChange(event) {
    if (this.props.model.setIndex(this.props.arg, Number(event.target.value))) {
      this.props.model.lazyFetchData();
    }
  },

  previous() {
    if (this.props.model.previous(this.props.arg)) {
      this.props.model.lazyFetchData();
      this.slider.focus();
    }
  },

  next() {
    if (this.props.model.next(this.props.arg)) {
      this.props.model.lazyFetchData();
      this.slider.focus();
    }
  },

  first() {
    if (this.props.model.first(this.props.arg)) {
      this.props.model.lazyFetchData();
      this.slider.focus();
    }
  },

  last() {
    if (this.props.model.last(this.props.arg)) {
      this.props.model.lazyFetchData();
      this.slider.focus();
    }
  },

  updateMode(event) {
    if (this.state.advanced !== event.altKey) {
      this.setState({ advanced: event.altKey });
    }
  },

  resetState(event) {
    this.setState({ advanced: false });
  },

  enableButtons(event) {
    this.setState({ button: true });
    this.slider.focus();
  },

  disableButtons() {
    this.setState({ button: false, advanced: false });
  },

  grabFocus() {
    this.slider.focus();
  },

  toggleAnimation() {
    this.props.model.toggleAnimationFlag(this.props.arg);
    this.setState({});
  },

  render() {
    return (
      <div
        className={this.props.model.getAnimationFlag(this.props.arg) ? style.itemActive : style.item}
        onKeyDown={this.updateMode}
        onKeyUp={this.resetState}
        onMouseLeave={this.disableButtons}
      >
        <div className={style.row}>
          <div className={style.label} onClick={this.toggleAnimation}>
            {this.props.model.label(this.props.arg)}
          </div>
          <div className={style.mobileOnly}>
            {this.props.model.getValue(this.props.arg)}
          </div>
          <div
            className={[style.itemControl, style.noMobile].join(' ')}
            onMouseEnter={this.enableButtons}
            onMouseLeave={this.disableButtons}
          >
            <div className={this.state.button ? style.hidden : style.itemControlValue}>
              {this.props.model.getValue(this.props.arg)}
            </div>
            <i
              className={this.state.button ? (this.state.advanced ? style.firstButton : style.previousButton) : style.hidden}
              onClick={this.state.advanced ? this.first : this.previous}
            />
            <i
              className={this.state.button ? (this.state.advanced ? style.lastButton : style.nextButton) : style.hidden}
              onClick={this.state.advanced ? this.last : this.next}
            />
          </div>
        </div>
        <div className={[style.row, style.mobileOnly].join(' ')}>
          <div className={style.itemControl}>
            <br />
            <i
              className={style.firstButton}
              onClick={this.first}
            />
            <i
              className={style.lastButton}
              onClick={this.last}
            />
            <i
              className={style.previousButton}
              onClick={this.previous}
            />
            <i
              className={style.nextButton}
              onClick={this.next}
            />
          </div>
        </div>
        <div className={style.row}>
          <div className={style.slider} onMouseEnter={this.grabFocus}>
            <input
              className={style.input}
              ref={(c) => { this.slider = c; }}
              type="range"
              min="0"
              max={this.props.model.getSize(this.props.arg) - 1}
              value={this.props.model.getIndex(this.props.arg)}
              onChange={this.onIndexChange}
            />
          </div>
        </div>
      </div>
    );
  },
});
