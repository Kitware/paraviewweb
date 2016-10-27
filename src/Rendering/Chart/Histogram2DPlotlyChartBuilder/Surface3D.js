function affine(inMin, val, inMax, outMin, outMax) {
  return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

export default function Surface3D(chartState, histogram) {
  if (!histogram) return null;

  const nBins = histogram.numberOfBins;
  const z = [];
  for (let i = 0; i < nBins; ++i) {
    const row = [];
    for (let j = 0; j < nBins; ++j) {
      row.push(0);
    }
    z.push(row);
  }

  histogram.bins.forEach((bin) => {
    const yIndex = Math.floor(affine(histogram.y.extent[0], bin.y, histogram.y.extent[1], 0, nBins - 1));
    const xIndex = Math.floor(affine(histogram.x.extent[0], bin.x, histogram.x.extent[1], 0, nBins - 1));

    z[yIndex][xIndex] = bin.count;
  });

  return {
    forceNewPlot: chartState.forceNewPlot,
    traces: [
      {
        z,
        type: 'surface',
      },
    ],
  // layout
  };
}
