import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ColorMapEditorWidget from 'paraviewweb/src/React/Widgets/ColorMapEditorWidget';
import presets from 'paraviewweb/src/React/Widgets/ColorMapEditorWidget/example/presets.json';

const container = document.querySelector('.content');

class ColorMapEditorTestWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPreset: 'Cool to Warm',
      rangeMin: 0,
      rangeMax: 200,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    };

    // Bind callback
    this.updatePreset = this.updatePreset.bind(this);
    this.updateOpacityPoints = this.updateOpacityPoints.bind(this);
    this.updateRange = this.updateRange.bind(this);
    this.rangeToCurrent = this.rangeToCurrent.bind(this);
    this.rangeToTime = this.rangeToTime.bind(this);
  }

  updatePreset(name) {
    this.setState({ currentPreset: name });
  }

  updateOpacityPoints(points) {
    this.setState({ points });
  }

  updateRange(range) {
    this.setState({ rangeMin: range[0], rangeMax: range[1] });
  }

  rangeToCurrent() {
    this.setState({ rangeMin: 0, rangeMax: 150 });
  }

  rangeToTime() {
    this.setState({ rangeMin: 0, rangeMax: 200 });
  }

  render() {
    return (
      <ColorMapEditorWidget
        currentPreset={this.state.currentPreset}
        currentOpacityPoints={this.state.points}
        presets={presets}
        dataRangeMin={0}
        dataRangeMax={200}
        rangeMin={this.state.rangeMin}
        rangeMax={this.state.rangeMax}
        onOpacityTransferFunctionChanged={this.updateOpacityPoints}
        onPresetChanged={this.updatePreset}
        onRangeEdited={this.updateRange}
        onScaleRangeToCurrent={this.rangeToCurrent}
        onScaleRangeOverTime={this.rangeToTime}
      />
    );
  }
}

container.style.height = '50%';
container.style.width = '50%';

ReactDOM.render(React.createElement(ColorMapEditorTestWidget, {}), container);

document.body.style.margin = '10px';
