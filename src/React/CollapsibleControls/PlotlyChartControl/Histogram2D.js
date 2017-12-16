import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

export default function render(props) {
  function handleChange(event) {
    const rootContainer = event.target.parentNode.parentNode.parentNode;
    const newXArray = rootContainer.querySelector('.jsX').value;
    const newYArray = rootContainer.querySelector('.jsY').value;
    // const forceNewPlot = props.arrays[props.chartState.x] !== props.arrays[newXArray] ||
    //   props.arrays[props.chartState.y] !== props.arrays[newYArray];
    props.onChange({
      chartType: 'Histogram2D',
      x: newXArray,
      y: newYArray,
      forceNewPlot: true,
    });
  }

  return (
    <div>
      <table className={style.fullWidth}>
        <tbody>
          <tr>
            <td className={style.label}>x</td>
            <td className={style.fullWidth}>
              <select className={['jsX', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.x}>
                {Object.keys(props.arrays).map(arrayName => <option value={arrayName} key={arrayName}>{arrayName}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <td className={style.label}>y</td>
            <td>
              <select className={['jsY', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.y}>
                {Object.keys(props.arrays).map(arrayName => <option value={arrayName} key={arrayName}>{arrayName}</option>)}
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

render.propTypes = {
  chartState: PropTypes.object,
  arrays: PropTypes.object,
  onChange: PropTypes.func,
};

render.defaultProps = {
  chartState: {},
  arrays: [],
  onChange: () => {},
};
