import React    from 'react';
import ReactDOM from 'react-dom';

export default React.createClass({

    displayName: 'ContentEditableWidget',

    propTypes: {
        blurOnEnter: React.PropTypes.bool,
        html: React.PropTypes.string,
        onChange: React.PropTypes.func,
    },

    getDefaultProps() {
        return {
            blurOnEnter: false,
        };
    },

    shouldComponentUpdate(nextProps) {
        return nextProps.html !== ReactDOM.findDOMNode(this).innerHTML;
    },

    componentDidUpdate() {
        if ( this.props.html !== ReactDOM.findDOMNode(this).innerHTML ) {
           ReactDOM.findDOMNode(this).innerHTML = this.props.html;
        }
    },

    setFocus() {
        const range = document.createRange();
        range.selectNodeContents(ReactDOM.findDOMNode(this));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    },

    blurEditable(event) {
        if (event.charCode === 13) {
            ReactDOM.findDOMNode(this).blur();
            window.getSelection().removeAllRanges();
        }
    },

    emitChange(evt) {
        var html = ReactDOM.findDOMNode(this).innerHTML;
        if (this.props.onChange && html !== this.lastHtml) {
            evt.target = { value: html };
            this.props.onChange(evt);
        }
        this.lastHtml = html;
    },

    /* eslint-disable react/no-danger */
    render() {
        return <div className="ContentEditable"
            onInput={this.emitChange}
            onBlur={this.emitChange}
            onKeyPress={ this.props.blurOnEnter ? this.blurEditable : ()=>{} }
            contentEditable
            dangerouslySetInnerHTML={{__html: this.props.html}}></div>;
    },
    /* eslint-enable react/no-danger */
})
