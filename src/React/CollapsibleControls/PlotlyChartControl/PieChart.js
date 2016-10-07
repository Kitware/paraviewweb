import React from 'react';
import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

const PlotlyPieChartWidget = (props) => {
  function handleChange(event) {
    const rootContainer = event.target.parentNode.parentNode.parentNode;
    const newLabelArray = rootContainer.querySelector('.jsLabels').value;
    const newValueArray = rootContainer.querySelector('.jsValues').value;
    const forceNewPlot = props.arrays[props.chartState.labels] !== props.arrays[newLabelArray] ||
      props.arrays[props.chartState.values] !== props.arrays[newValueArray];
    props.onChange({
      chartType: 'PieChart',
      labels: newLabelArray,
      values: newValueArray,
      operation: rootContainer.querySelector('.jsOps').value,
      forceNewPlot,
    });
  }

  return (
    <div>
      <table className={style.fullWidth}>
        <tbody>
          <tr>
            <td className={style.label}>labels</td>
            <td className={style.fullWidth}>
              <select className={['jsLabels', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.labels}>
                {Object.keys(props.arrays).filter((elt, idx, array) => props.arrays[elt] === 'categorical')
                  .map(name => <option value={name} key={name}>{name}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <td className={style.label}>values</td>
            <td>
              <select className={['jsValues', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.values}>
                {Object.keys(props.arrays).map(name => <option value={name} key={name}>{name}</option>)}
              </select>
            </td>
          </tr>
          <tr>
            <td className={style.label}>Operation</td>
            <td>
              <select className={['jsOps', style.fullWidth].join(' ')} onChange={handleChange} value={props.chartState.operation}>
                <option value="Count" key="Count">Count</option>
                <option value="Average" key="Average">Average</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

PlotlyPieChartWidget.propTypes = {
  chartState: React.PropTypes.object,
  arrays: React.PropTypes.object,
  onChange: React.PropTypes.func,
};

PlotlyPieChartWidget.defaultProps = {
  chartState: {},
  arrays: [],
  onChange: () => {},
};

export default PlotlyPieChartWidget;
