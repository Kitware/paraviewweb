import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import NumberSliderWidget from '..';

class ColorField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      r: 30,
      g: 60,
      b: 90,
    };

    // Bind callback
    this.updateVal = this.updateVal.bind(this);
    this.drawColor = this.drawColor.bind(this);
  }

  componentDidMount() {
    this.drawColor();
  }

  componentDidUpdate() {
    this.drawColor();
  }

  updateVal(e) {
    const which = e.target.name;
    const newVal = e.target.value;
    const toUpdate = {};
    toUpdate[which] = newVal;
    this.setState(toUpdate);
  }

  drawColor() {
    const ctx = this.canvas.getContext('2d');
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.fillStyle = `rgb(${this.state.r}, ${this.state.g}, ${this.state.b})`;
    ctx.rect(0, 0, width, height);
    ctx.fill();
  }

  render() {
    const [r, g, b] = [this.state.r, this.state.g, this.state.b];
    return (
      <section style={{ margin: '20px' }}>
        <NumberSliderWidget
          value={r}
          max="255"
          min="0"
          onChange={this.updateVal}
          name="r"
        />
        <NumberSliderWidget
          value={g}
          max="255"
          min="0"
          onChange={this.updateVal}
          name="g"
        />
        <NumberSliderWidget
          value={b}
          max="255"
          min="0"
          onChange={this.updateVal}
          name="b"
        />
        <canvas
          ref={(c) => {
            this.canvas = c;
          }}
          width="50"
          height="50"
        />
      </section>
    );
  }
}

ReactDOM.render(<ColorField />, document.querySelector('.content'));
