export default {
  dimensions: [200, 900],
  layers: [
    {
      active: true,
      array: 'temp',
      arrays: ['temp', 'fission_rate'],
      hasMesh: true,
      name: 'shell',
      type: 'Float32Array',
    },
    {
      active: true,
      array: 'temp',
      arrays: ['temp', 'burnup'],
      hasMesh: true,
      name: 'rod',
      type: 'Float32Array',
    },
  ],
  ranges: {
    burnup: [0, 0.03915101642441825],
    fission_rate: [0, 0],
    temp: [300, 1635.7730517148655],
  },
};
