/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    getScalarBarVisibilities: (proxyIdList) => {
      return session.call('pv.color.manager.scalarbar.visibility.get', [
        proxyIdList,
      ]);
    },
    setScalarBarVisibilities: (proxyIdMap) => {
      return session.call('pv.color.manager.scalarbar.visibility.set', [
        proxyIdMap,
      ]);
    },
    rescaleTransferFunction: (options) => {
      return session.call('pv.color.manager.rescale.transfer.function', [
        options,
      ]);
    },
    getCurrentScalarRange: (proxyId) => {
      return session.call('pv.color.manager.scalar.range.get', [proxyId]);
    },
    colorBy: (
      representation,
      colorMode,
      arrayLocation = 'POINTS',
      arrayName = '',
      vectorMode = 'Magnitude',
      vectorComponent = 0,
      rescale = false
    ) => {
      return session.call('pv.color.manager.color.by', [
        representation,
        colorMode,
        arrayLocation,
        arrayName,
        vectorMode,
        vectorComponent,
        rescale,
      ]);
    },
    setOpacityFunctionPoints: (
      arrayName,
      pointArray,
      enableSurfaceOpacity = false
    ) => {
      return session.call('pv.color.manager.opacity.points.set', [
        arrayName,
        pointArray,
        enableSurfaceOpacity,
      ]);
    },
    getOpacityFunctionPoints: (arrayName) => {
      return session.call('pv.color.manager.opacity.points.get', [arrayName]);
    },
    getRgbPoints: (arrayName) => {
      return session.call('pv.color.manager.rgb.points.get', [arrayName]);
    },
    setRgbPoints: (arrayName, rgbInfo) => {
      return session.call('pv.color.manager.rgb.points.set', [
        arrayName,
        rgbInfo,
      ]);
    },
    getLutImage: (representation, numSamples, customRange = null) => {
      return session.call('pv.color.manager.lut.image.get', [
        representation,
        numSamples,
        customRange,
      ]);
    },
    setSurfaceOpacity: (representation, enabled) => {
      return session.call('pv.color.manager.surface.opacity.set', [
        representation,
        enabled,
      ]);
    },
    getSurfaceOpacity: (representation) => {
      return session.call('pv.color.manager.surface.opacity.get', [
        representation,
      ]);
    },
    setSurfaceOpacityByArray: (arrayName, enabled) => {
      return session.call('pv.color.manager.surface.opacity.by.array.set', [
        arrayName,
        enabled,
      ]);
    },
    getSurfaceOpacityByArray: (arrayName) => {
      return session.call('pv.color.manager.surface.opacity.by.array.get', [
        arrayName,
      ]);
    },
    selectColorMap: (representation, paletteName) => {
      return session.call('pv.color.manager.select.preset', [
        representation,
        paletteName,
      ]);
    },
    listColorMapNames: () => {
      return session.call('pv.color.manager.list.preset', []);
    },
    listColorMapImages: (numSamples = 256) => {
      return session.call('pv.color.manager.lut.image.all', [numSamples]);
    },
  };
}
