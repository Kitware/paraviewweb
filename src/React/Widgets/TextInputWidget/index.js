import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/TextInputWidget.mcss';

export default class TextInputWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: props.editing,
      valueRep: props.value,
    };

    // Bind callback
    this.isEditing = this.isEditing.bind(this);
    this.valueChange = this.valueChange.bind(this);
    this.endEditing = this.endEditing.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  componentDidMount() {
    if (this.props.grabFocus && this.textInput) {
      this.textInput.focus();
    }
  }

  isEditing() {
    return this.state.editing;
  }

  valueChange(e) {
    const newVal = e.target.value;
    this.setState({ editing: true, valueRep: newVal });
  }

  endEditing() {
    if (!this.state.editing) return;
    this.setState({ editing: false });

    if (!this.props.onChange) return;
    if (this.props.name) {
      this.props.onChange(this.state.valueRep, this.props.name);
    } else {
      this.props.onChange(this.state.valueRep);
    }
  }

  handleKeyUp(e) {
    if (!this.textInput) return;
    if (e.key === 'Enter' || e.key === 'Return') {
      this.textInput.blur();
      if (!this.props.blurEndsEdit) this.endEditing();
    } else if (e.key === 'Escape') {
      this.setState({ valueRep: this.props.value });
      if (this.props.escEndsEdit) {
        // needs to happen at next idle so it happens after setState.
        setTimeout(() => {
          this.textInput.blur();
          if (!this.props.blurEndsEdit) this.endEditing();
        }, 0);
      }
    }
  }

  render() {
    const inlineStyle = this.props.maxWidth
      ? { maxWidth: this.props.maxWidth }
      : {};
    return (
      <div className={[style.container, this.props.className].join(' ')}>
        <input
          className={style.entry}
          type="text"
          value={this.state.editing ? this.state.valueRep : this.props.value}
          placeholder={this.props.placeholder}
          style={inlineStyle}
          onChange={this.valueChange}
          onBlur={this.props.blurEndsEdit ? this.endEditing : null}
          onKeyUp={this.handleKeyUp}
          ref={(c) => {
            this.textInput = c;
          }}
        />
        {
          // Use the check icon by default, but allow customization, for example: fa-search
        }
        <i
          className={[
            this.state.editing ? style.editingButton : style.button,
            this.props.icon,
          ].join(' ')}
          onClick={this.endEditing}
        />
      </div>
    );
  }
}

TextInputWidget.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  maxWidth: PropTypes.string,
  icon: PropTypes.string,
  editing: PropTypes.bool,
  escEndsEdit: PropTypes.bool,
  blurEndsEdit: PropTypes.bool,
  grabFocus: PropTypes.bool,
};

TextInputWidget.defaultProps = {
  value: '',
  className: '',
  icon: `${style.checkIcon}`,
  editing: false,
  escEndsEdit: false,
  blurEndsEdit: true,
  grabFocus: false,
  name: '',
  onChange: undefined,
  placeholder: '',
  maxWidth: '',
};
