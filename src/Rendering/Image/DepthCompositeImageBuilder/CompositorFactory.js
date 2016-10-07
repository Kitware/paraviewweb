import contains from 'mout/src/array/contains';
import rgbd from './rgbd-compositor';
import light from './sxyz-light-compositor';
import raw from './raw-rgbd-compositor';

const
  CompositorMap = {
    rgbd,
    'sxyz-light': light,
    'raw-rgbd': raw,
  };

function createCompositor(dataType, options) {
  let instance = null;
  Object.keys(CompositorMap).forEach((type) => {
    if (!instance && contains(dataType, type)) {
      instance = new CompositorMap[type](options);
    }
  });
  if (!instance) {
    console.error('No compositor found for type', dataType);
  }
  return instance;
}

export default {
  createCompositor,
};
