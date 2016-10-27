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

  return {
    forceNewPlot: chartState.forceNewPlot,
    traces: [
      {
        x,
        y,
        mode: 'markers',
        marker: {
          size: 10,
          color,
        },
      },
    ],
  // layout
  };
}
