import contains from 'mout/src/array/contains';
import rgbd     from './rgbd-compositor';
import light    from './sxyz-light-compositor';
import raw      from './raw-rgbd-compositor';

const
    CompositorMap = {
        rgbd,
        'sxyz-light': light,
        'raw-rgbd'  : raw,
    };

function createCompositor(dataType, options) {
    for(const type in CompositorMap) {
        if(contains(dataType, type)) {
            return new CompositorMap[type](options);
        }
    }
    console.error("No compositor found for type", dataType);
    return null;
}

export default {
    createCompositor,
}