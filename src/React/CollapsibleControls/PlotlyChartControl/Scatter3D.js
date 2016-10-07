import React                    from 'react';
import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

/* eslint-disable react/no-unused-prop-types */

const PlotlyScatter3Didget = (props) => {
  function handleChange(event) {
    const rootContainer = event.target.parentNode.parentNode.parentNode;
    const newXArray = rootContainer.querySelector('.jsX').value;
    const newYArray = rootContainer.querySelector('.jsY').value;
    const newZArray = rootContainer.querySelector('.jsZ').value;
    const forceNewPlot = props.arrays[props.chartState.x] !== props.arrays[newXArray] ||
      props.arrays[props.chartState.y] !== props.arrays[newYArray] ||
      props.arrays[props.chartState.z] !== props.arrays[newZArray];
    props.onChange({
      chartType: 'Scatter3D',
      x: newXArray,
      y: newYArray,
      z: newZArray,
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
          <tr>
            <td className={style.label}>z</td>
            <td>
              <select className={['jsZ', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.z}>
                {Object.keys(props.arrays).map(arrayName => <option value={arrayName} key={arrayName}>{arrayName}</option>)}
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

PlotlyScatter3Didget.propTypes = {
  chartState: React.PropTypes.object,
  arrays: React.PropTypes.object,
  onChange: React.PropTypes.func,
};

PlotlyScatter3Didget.defaultProps = {
  chartState: {},
  arrays: [],
  onChange: () => {},
};

export default PlotlyScatter3Didget;
