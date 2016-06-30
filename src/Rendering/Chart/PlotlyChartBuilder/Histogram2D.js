
export default function Histogram2D(chartState, csvReader, arraysInfo) {
  const arrayNames = Object.keys(arraysInfo);
  if (!chartState.x) {
    chartState.x = arrayNames[0];
  }

  if (!chartState.y) {
    chartState.y = arrayNames[(arrayNames.length >= 2 ? 1 : 0)];
  }

  return [
    {
      x: csvReader.getColumn(chartState.x),
      y: csvReader.getColumn(chartState.y),
      type: 'histogram2d',
      forceNewPlot: true,      // Due to a bug in plotly redraw w/ 2D histogram
    },
  ];
}
