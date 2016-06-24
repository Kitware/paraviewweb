
export default function Scatter3D(chartState, csvReader, arraysInfo) {
  const arrayNames = Object.keys(arraysInfo);
  if (!chartState.x) {
    chartState.x = arrayNames[0];
  }

  if (!chartState.y) {
    chartState.y = arrayNames[(arrayNames.length >= 2 ? 1 : 0)];
  }

  if (!chartState.z) {
    chartState.z = arrayNames[(arrayNames.length >= 3 ? 2 : (arrayNames.length >= 2 ? 1 : 0))];
  }

  return [
    {
      x: csvReader.getColumn(chartState.x),
      y: csvReader.getColumn(chartState.y),
      z: csvReader.getColumn(chartState.z),
      type: 'scatter3d',
      mode: 'markers+text',
    },
  ];
}
