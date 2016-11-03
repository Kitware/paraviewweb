export default function Scatter(chartState, histogram) {
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
        mode: 'markers',
        marker: {
          size: 10,
          color,
        },
      },
    ],
    layout: {
      hovermode: 'closest',
      xaxis: {
        title: histogram.x.name,
      },
      yaxis: {
        title: histogram.y.name,
      },
    },
  };
}
