export default function Scatter(chartState, histogram, chartType) {
  if (!histogram) return null;

  const x = [];
  const y = [];
  const color = [];

  histogram.bins.forEach((bin) => {
    x.push(bin.x);
    y.push(bin.y);
    color.push(bin.count);
  });

  // 'text' shows up in the hover popup.
  return {
    forceNewPlot: chartState.forceNewPlot,
    traces: [
      {
        x,
        y,
        text: color.map(count => (`Count: ${count}`)),
        type: chartType,
        mode: 'markers',
        marker: {
          size: 12,
          // size: color,
          color,
          colorscale: chartState.colormap, // Viridis
          showscale: true,
          reversescale: chartState.reversescale,
        },
      },
    ],
    layout: {
      hovermode: 'closest',
      margin: {
        t: 40,
      },
      xaxis: {
        title: histogram.x.name,
      },
      yaxis: {
        title: histogram.y.name,
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
