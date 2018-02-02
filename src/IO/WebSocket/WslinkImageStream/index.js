/* global Blob window URL */
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

function wslinkImageStream(publicAPI, model) {
  if (!model.client) throw Error('Client must be provided');

  model.metadata = null;
  model.activeURL = null;
  model.fps = 0;
  model.lastTime = +new Date();

  model.lastImageReadyEvent = null;

  // This functionality is apparently unused.
  publicAPI.enableView = (enabled) => {
    model.client.VtkImageDelivery.enableView(model.view_id, enabled);
  };

  publicAPI.startInteractiveQuality = () => {
    model.client.VtkImageDelivery.viewQuality(
      model.view_id,
      model.interactiveQuality,
      model.interactiveRatio
    );
  };

  publicAPI.stopInteractiveQuality = () => {
    model.client.VtkImageDelivery.viewQuality(
      model.view_id,
      model.stillQuality,
      model.stillRatio
    );
  };

  publicAPI.setViewSize = (width, height) => {
    model.client.VtkImageDelivery.viewSize(model.view_id, width, height);
  };

  publicAPI.invalidateCache = () => {
    model.client.VtkImageDelivery.invalidateCache(model.view_id);
  };

  publicAPI.updateQuality = (stillQuality = 100, interactiveQuality = 50) => {
    model.stillQuality = stillQuality;
    model.interactiveQuality = interactiveQuality;
  };

  publicAPI.updateResolutionRatio = (sRatio = 1, iRatio = 0.5) => {
    model.stillRatio = sRatio;
    model.interactiveRatio = iRatio;
  };

  publicAPI.unsubscribeRenderTopic = () => {
    model.client.VtkImageDelivery.offRenderChange(
      model.renderTopicSubscription
    ).then(
      (unsubSuccess) => {
        console.log('Unsubscribe resolved ', unsubSuccess);
      },
      (unsubFailure) => {
        console.log('Unsubscribe error ', unsubFailure);
      }
    );
  };

  // subscribeRenderTopic = () => {
  //   model.client.VtkImageDelivery.onRenderChange(publicAPI.viewChanged).then((subscription) => {
  //     model.renderTopicSubscription = subscription;
  //   }, (subError) => {
  //     console.log('Failed to subscribe to topic');
  //     console.log(subError);
  //   });
  // }

  publicAPI.removeRenderObserver = (viewId) => {
    model.client.VtkImageDelivery.removeRenderObserver(viewId).then(
      (successResult) => {
        console.log(`Removed observer from view ${viewId} succeeded`);
        console.log(successResult);
      },
      (failureResult) => {
        console.log(`Failed to remove observer from view ${viewId}`);
        console.log(failureResult);
      }
    );
  };

  // addRenderObserver(viewId) {
  //   model.client.VtkImageDelivery.addRenderObserver(viewId).then((successResult) => {
  //     console.log(`Successfully added observer to view ${viewId}`);
  //     console.log(successResult);
  //   }, (failureResult) => {
  //     console.log(`Failed to add observer to view ${viewId}`);
  //     console.log(failureResult);
  //   });
  // }

  publicAPI.setViewId = (viewId) => {
    if (model.view_id === viewId) {
      return false;
    }
    model.client.VtkImageDelivery.removeRenderObserver(model.view_id);
    model.view_id = viewId;
    model.client.VtkImageDelivery.addRenderObserver(model.view_id);
    return true;
  };

  publicAPI.viewChanged = (data) => {
    const msg = data[0];
    if (!msg) return;
    const imgBlob = new Blob([msg.image], {
      type: model.mimeType,
    });
    if (model.activeURL) {
      window.URL.revokeObjectURL(model.activeURL);
      model.activeURL = null;
    }
    model.activeURL = URL.createObjectURL(imgBlob);
    const time = +new Date();
    model.fps = Math.floor(10000 / (time - model.lastTime)) / 10;
    model.lastTime = time;

    model.lastImageReadyEvent = {
      url: model.activeURL,
      fps: model.fps,
      metadata: { size: msg.size, id: msg.id },
    };

    publicAPI.fireImageReady(model.lastImageReadyEvent);
  };

  /* eslint-disable camelcase */
  publicAPI.connect = ({ view_id = -1, size = [500, 500] }) =>
    // Subscribe to pubsub topic and add view observer
    new Promise((resolve, reject) => {
      model.view_id = view_id;
      model.width = size[0];
      model.height = size[1];

      model.client.VtkImageDelivery.onRenderChange(publicAPI.viewChanged).then(
        (subscription) => {
          model.renderTopicSubscription = subscription;
          model.client.VtkImageDelivery.addRenderObserver(view_id).then(
            (successResult) => {
              if (successResult.viewId) {
                model.view_id = successResult.viewId;
              }
              console.log(`Successfully added observer to view ${view_id}`);
              console.log(successResult);
              resolve(successResult);
            },
            (failureResult) => {
              console.log(`Failed to add observer to view ${view_id}`);
              console.log(failureResult);
              reject(failureResult);
            }
          );
        },
        (subError) => {
          console.log('Failed to subscribe to topic');
          console.log(subError);
          reject(subError);
        }
      );
    });
  /* eslint-enable camelcase */

  function cleanUp() {
    publicAPI.removeRenderObserver(model.view_id);
    publicAPI.unsubscribeRenderTopic();
  }

  publicAPI.destroy = CompositeClosureHelper.chain(cleanUp, publicAPI.destroy);

  publicAPI.getLastImageReadyEvent = () => model.lastImageReadyEvent;
}

const DEFAULT_VALUES = {
  stillRatio: 1,
  interactiveRatio: 0.5,
  stillQuality: 100,
  interactiveQuality: 50,
  mimeType: 'image/jpeg',
  view_id: -1,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.event(publicAPI, model, 'ImageReady');
  CompositeClosureHelper.isA(publicAPI, model, 'WslinkImageStream');

  wslinkImageStream(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = CompositeClosureHelper.newInstance(extend);

export default { newInstance, extend };
