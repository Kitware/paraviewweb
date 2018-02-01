import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

export default function render(props) {
  function handleChange(event) {
    const newXArray = event.target.value;
    const forceNewPlot =
      props.arrays[props.chartState.x] !== props.arrays[newXArray];
    props.onChange({
      chartType: 'Histogram',
      x: newXArray,
      forceNewPlot,
    });
  }

  return (
    <div>
      <table className={style.fullWidth}>
        <tbody>
          <tr>
            <td className={style.label}>x</td>
            <td className={style.fullWidth}>
              <select
                className={style.fullWidth}
                onChange={handleChange}
                value={props.chartState.x}
              >
                {Object.keys(props.arrays).map((arrayName) => (
                  <option value={arrayName} key={arrayName}>
                    {arrayName}
                  </option>
                ))}
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
  arrays: {},
  onChange: () => {},
};
