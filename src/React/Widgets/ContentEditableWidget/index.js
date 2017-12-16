import React from 'react';
import PropTypes from 'prop-types';

const noOp = () => { };

export default class ContentEditableWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    // Bind callback
    this.setFocus = this.setFocus.bind(this);
    this.blurEditable = this.blurEditable.bind(this);
    this.emitChange = this.emitChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.html !== this.rootContainer.innerHTML;
  }

  componentDidUpdate() {
    if (this.props.html !== this.rootContainer.innerHTML) {
      this.rootContainer.innerHTML = this.props.html;
    }
  }

  setFocus() {
    const range = document.createRange();
    range.selectNodeContents(this.rootContainer);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  blurEditable(event) {
    if (event.charCode === 13) {
      this.rootContainer.blur();
      window.getSelection().removeAllRanges();
      if (this.props.onBlur) {
        this.props.onBlur();
      }
    }
  }

  emitChange(evt) {
    var html = this.rootContainer.innerHTML;
    if (this.props.onChange && html !== this.lastHtml) {
      evt.target.value = html;
      this.props.onChange(evt);
    }
    this.lastHtml = html;
    if (evt.type === 'blur' && this.props.onBlur) {
      this.props.onBlur();
    }
  }

  /* eslint-disable react/no-danger */
  render() {
    return (
      <div
        ref={c => (this.rootContainer = c)}
        className={this.props.className}
        onInput={this.emitChange}
        onBlur={this.emitChange}
        onKeyPress={this.props.blurOnEnter ? this.blurEditable : noOp}
        contentEditable
        dangerouslySetInnerHTML={{ __html: this.props.html }}
      />);
  }
  /* eslint-enable react/no-danger */
}

ContentEditableWidget.propTypes = {
  blurOnEnter: PropTypes.bool,
  className: PropTypes.string,
  html: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
};

ContentEditableWidget.defaultProps = {
  blurOnEnter: false,
  className: '',
};
