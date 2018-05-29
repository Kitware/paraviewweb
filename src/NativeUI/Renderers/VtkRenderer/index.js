import CompositeClosureHelper from 'paraviewweb/src/Common/Core/CompositeClosureHelper';

import sizeHelper from 'paraviewweb/src/Common/Misc/SizeHelper';
import WslinkImageStream from 'paraviewweb/src/IO/WebSocket/WslinkImageStream';
import NativeImageRenderer from 'paraviewweb/src/NativeUI/Renderers/NativeImageRenderer';
import VtkWebMouseListener from 'paraviewweb/src/Interaction/Core/VtkWebMouseListener';

function vtkRenderer(publicAPI, model) {
  publicAPI.setContainer = (container = model.container) => {
    model.container = container;
    if (model.imageRenderer) {
      model.imageRenderer.setContainer(model.container);
      publicAPI.resize();
    }
  };

  publicAPI.setSize = (width = model.size[0], height = model.size[1]) => {
    model.size = [width, height];
    if (model.mouseListener && model.binaryImageStream) {
      model.mouseListener.updateSize(width, height);
      model.binaryImageStream.setViewSize(width, height);
      model.imageRenderer.setSize(width, height);
    }
  };

  publicAPI.resize = () => {
    if (model.container) {
      const { clientWidth, clientHeight } = sizeHelper.getSize(model.container);
      publicAPI.setSize(clientWidth, clientHeight);
    }
  };

  publicAPI.render = () => {
    if (model.binaryImageStream) {
      model.binaryImageStream.invalidateCache();
    }
  };

  publicAPI.setViewId = (viewId = -1) => {
    model.viewId = Number(viewId);
    model.mouseListener.viewId = model.viewId;
    if (
      model.binaryImageStream &&
      model.binaryImageStream.setViewId(model.viewId)
    ) {
      model.binaryImageStream.invalidateCache();
      publicAPI.resize();
    }
  };

  publicAPI.setJPEGQuality = (
    still = model.stillQuality,
    interactive = model.interactiveQuality
  ) => {
    model.stillQuality = still;
    model.interactiveQuality = interactive;
    if (model.binaryImageStream) {
      model.binaryImageStream.updateQuality(still, interactive);
    }
  };

  publicAPI.setResolutionRatio = (
    still = model.stillRatio,
    interactive = model.interactiveRatio
  ) => {
    model.stillRatio = still;
    model.interactiveRatio = interactive;
    if (model.binaryImageStream) {
      model.binaryImageStream.updateResolutionRatio(still, interactive);
    }
  };

  publicAPI.setShowFPS = (showFPS = model.showFPS) => {
    model.showFPS = showFPS;
    if (model.imageRenderer) {
      model.imageRenderer.setDrawFPS(showFPS);
    }
  };

  publicAPI.setServerMaxFPS = (serverMaxFPS = model.serverMaxFPS) => {
    model.serverMaxFPS = serverMaxFPS;
    if (model.binaryImageStream) {
      model.binaryImageStream.setMaxFrameRate(model.serverMaxFPS);
    }
  };

  publicAPI.setMouseThrottleTime = (
    mouseThrottleTime = model.mouseThrottleTime
  ) => {
    model.mouseThrottleTime = mouseThrottleTime;
    if (model.mouseListener) {
      model.mouseListener.setThrottleTime(model.mouseThrottleTime);
    }
  };

  publicAPI.setClient = (client = model.client) => {
    model.client = client;

    if (client) {
      model.binaryImageStream = WslinkImageStream.newInstance({ client });
      model.mouseListener = new VtkWebMouseListener(client);

      // Create render
      model.imageRenderer = new NativeImageRenderer(
        model.container,
        model.binaryImageStream,
        model.mouseListener.getListeners(),
        model.showFPS
      );

      // Establish image stream connection
      model.binaryImageStream
        .connect({
          view_id: model.viewId,
        })
        .then(() => {
          // Update size and do a force push
          publicAPI.resize();
          model.binaryImageStream.invalidateCache();
        });

      // Handle mouse interaction
      model.mouseListener.onInteraction((interact) => {
        if (model.interacting === interact) {
          return;
        }
        model.interacting = interact;
        if (interact) {
          model.binaryImageStream.startInteractiveQuality();
        } else {
          model.binaryImageStream
            .stopInteractiveQuality()
            .then(model.binaryImageStream.invalidateCache);
          setTimeout(
            model.binaryImageStream.invalidateCache,
            model.interactionTimout
          );
        }
      });
    }
  };

  const superDestroy = publicAPI.destroy;
  publicAPI.destroy = () => {
    publicAPI.setContainer(null);
    if (model.mouseListener) {
      model.mouseListener.destroy();
      model.mouseListener = null;
    }

    if (model.imageRenderer) {
      model.imageRenderer.destroy();
      model.imageRenderer = null;
    }

    if (model.subscription) {
      model.subscription.unsubscribe();
      model.subscription = null;
    }

    if (model.binaryImageStream) {
      model.binaryImageStream.destroy();
      model.binaryImageStream = null;
    }
    superDestroy();
  };

  // Auto init if all props are passed in...
  publicAPI.setClient();
  publicAPI.setShowFPS();
  publicAPI.setContainer();
  publicAPI.setJPEGQuality();
  publicAPI.setMouseThrottleTime();
  publicAPI.setResolutionRatio();
  publicAPI.setServerMaxFPS();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  interacting: false,
  interactionTimout: 500,
  interactiveQuality: 50,
  interactiveRatio: 1,
  mouseThrottleTime: 16.6, // ms
  serverMaxFPS: 30,
  showFPS: false,
  size: [400, 400],
  stillQuality: 100,
  stillRatio: 1,
  viewId: -1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.get(publicAPI, model, [
    'interacting',
    'interactionTimout',
    'interactiveQuality',
    'interactiveRatio',
    'mouseThrottleTime',
    'serverMaxFPS',
    'showFPS',
    'size',
    'stillQuality',
    'stillRatio',
    'viewId',
  ]);

  vtkRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
