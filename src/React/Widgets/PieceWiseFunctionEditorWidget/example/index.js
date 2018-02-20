import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import PieceWiseFunctionEditorWidget from 'paraviewweb/src/React/Widgets/PieceWiseFunctionEditorWidget';

const container = document.querySelector('.content');

container.style.height = '50%';
container.style.width = '50%';

class PieceWiseTestWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };

    // Bind callback
    this.updatePoints = this.updatePoints.bind(this);
  }

  updatePoints(points) {
    this.setState({ points });
    console.log(points);
  }

  render() {
    return (
      <PieceWiseFunctionEditorWidget
        points={this.state.points}
        rangeMin={0}
        rangeMax={100}
        onChange={this.updatePoints}
        visible
      />
    );
  }
}

ReactDOM.render(<PieceWiseTestWidget />, container);

document.body.style.margin = '10px';
