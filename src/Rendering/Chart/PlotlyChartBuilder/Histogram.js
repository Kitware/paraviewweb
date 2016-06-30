
export default function Histogram(chartState, csvReader, arraysInfo) {
  if (!chartState.x) {
    chartState.x = Object.keys(arraysInfo)[0];
  }
  return [
    {
      x: csvReader.getColumn(chartState.x),
      type: 'histogram',
    },
  ];
}
