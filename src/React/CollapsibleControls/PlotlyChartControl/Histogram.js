import React                    from 'react';
import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

const PlotlyHistogramWidget = (props) => {
  function handleChange(event) {
    const newXArray = event.target.value;
    const forceNewPlot = props.arrays[props.chartState.x] !== props.arrays[newXArray];
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
              <select className={style.fullWidth} onChange={handleChange} value={props.chartState.x}>
                {Object.keys(props.arrays).map(arrayName => <option value={arrayName} key={arrayName}>{arrayName}</option>)}
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

PlotlyHistogramWidget.propTypes = {
  chartState: React.PropTypes.object,
  arrays: React.PropTypes.object,
  onChange: React.PropTypes.func,
};

PlotlyHistogramWidget.defaultProps = {
  chartState: {},
  arrays: {},
  onChange: () => {},
};

export default PlotlyHistogramWidget;
