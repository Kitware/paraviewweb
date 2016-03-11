import React            from 'react';
import ReactDOM         from 'react-dom';
import PropertyPanelBlock from '..';
import data from './data.json';

var component = null;
const PropertyPanelDemo = React.createClass({
  displayName: 'PropertyPanelDemo',
  propTypes:{
    input: React.PropTypes.array,
  },
  getInitialState() {
    return {
      input: this.props.input,
    };
  },
  render() {
    return (
      <PropertyPanelBlock input={this.state.input}/>
    );
  },
});

component = ReactDOM.render(<PropertyPanelDemo input={DataInput}/>, document.querySelector('.content'));
