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
 *       Expect the name of the argument this String UI element control within the model.
 */
export default React.createClass({

  displayName: 'ParameterSet.String',

  propTypes: {
    arg: React.PropTypes.string,
    model: React.PropTypes.object.isRequired,
  },

  mixins: [DataListenerMixin, DataListenerUpdateMixin],

  handleChange(event) {
    if (this.props.model.setValue(this.props.arg, event.target.value)) {
      this.props.model.lazyFetchData();
    }
  },

  grabFocus() {
    this.select.focus();
  },

  toggleAnimation() {
    this.props.model.toggleAnimationFlag(this.props.arg);
    this.setState({});
  },

  render() {
    return (
      <div className={this.props.model.getAnimationFlag(this.props.arg) ? style.itemActive : style.item}>
        <div className={[style.row, style.label].join(' ')} onClick={this.toggleAnimation}>
          {this.props.model.label(this.props.arg)}
        </div>
        <div className={style.row} onMouseEnter={this.grabFocus}>
          <select
            className={style.input}
            ref={(c) => { this.select = c; }}
            value={this.props.model.getValue(this.props.arg)}
            onChange={this.handleChange}
          >
            {this.props.model.getValues(this.props.arg).map(v =>
              <option key={v} value={v}>{v}</option>
            )}
          </select>
        </div>
      </div>
    );
  },

});
