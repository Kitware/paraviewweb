import React                    from 'react';
import style from 'PVWStyle/ReactWidgets/PlotlySelectionWidgets.mcss';

const PlotlyHistogram2DWidget = (props) => {
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
};

PlotlyHistogram2DWidget.propTypes = {
  chartState: React.PropTypes.object,
  arrays: React.PropTypes.object,
  onChange: React.PropTypes.func,
};

PlotlyHistogram2DWidget.defaultProps = {
  chartState: {},
  arrays: [],
  onChange: () => {},
};

export default PlotlyHistogram2DWidget;
