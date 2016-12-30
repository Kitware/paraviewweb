export default function ScatterXY(chartState, scatter, chartType) {
  if (!scatter) return null;

  const x = scatter[0].data;
  const y = scatter[1].data;
  const trace2 = {
    x,
    y,
    type: chartType,
    colorscale: chartState.colormap,
    reversescale: chartState.reversescale,
  };

  return {
    forceNewPlot: chartState.forceNewPlot,
    traces: [
      {
        x,
        y,
        type: 'scatter',
        mode: 'markers',
        marker: {
          color: 'rgba(156, 165, 196, 0.65)',
          line: {
            color: 'rgba(106, 115, 146, 1.0)',
            width: 1,
          },
          symbol: 'circle',
          size: 8,
        },
      },
    ].concat(chartType !== 'scatter' ? trace2 : []),
    layout: {
      hovermode: 'closest',
      margin: {
        t: 40,
      },
      xaxis: {
        title: scatter[0].name,
      },
      yaxis: {
        title: scatter[1].name,
      },
    },
    config: {
      scrollZoom: true,
      displayModeBar: true,
      displaylogo: false,
      showLink: false,
      modeBarButtonsToRemove: ['sendDataToCloud'],
    },
  };
}
