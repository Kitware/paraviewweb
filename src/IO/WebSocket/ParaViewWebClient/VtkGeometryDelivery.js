let binaryDelivery = true;

export default function createMethods(session) {
  return {
    getArray: (hash, binary = binaryDelivery) =>
      session.call('viewport.geometry.array.get', [hash, binary]),
    onViewChange: (callback) =>
      session.subscribe('viewport.geometry.view.subscription', callback),
    offViewChange: (subscription) => session.unsubscribe(subscription),
    addViewObserver: (viewId) =>
      session.call('viewport.geometry.view.observer.add', [viewId]),
    removeViewObserver: (viewId) =>
      session.call('viewport.geometry.view.observer.remove', [viewId]),
  };
}

export function useBase64Delivery() {
  binaryDelivery = false;
}

export function useBinaryDelivery() {
  binaryDelivery = true;
}
