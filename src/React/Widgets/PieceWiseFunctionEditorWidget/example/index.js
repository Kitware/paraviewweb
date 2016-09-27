import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import PieceWiseFunctionEditorWidget from '..';

const container = document.querySelector('.content');

container.style.height = "50%";
container.style.width = "50%";

const PieceWiseTestWidget = React.createClass({
  displayName: 'PieceWiseTestWidget',

  getInitialState() {
    return {
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };
  },

  updatePoints(points) {
    this.setState({ points });
    console.log(points);
  },

  render() {
    return (
      <PieceWiseFunctionEditorWidget
        points={this.state.points}
        rangeMin={0}
        rangeMax={100}
        onChange={this.updatePoints}
        visible={true}
      />
    );
  },
});

ReactDOM.render(
    React.createElement(
      PieceWiseTestWidget,
      {}),
    container);

document.body.style.margin = '10px';
