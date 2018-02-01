export default function createMethods(session) {
  return {
    getArray: (hash) => session.call('viewport.geometry.array.get', [hash]),
    onViewChange: (callback) =>
      session.subscribe('viewport.geometry.view.subscription', callback),
    offViewChange: (subscription) => session.unsubscribe(subscription),
    addViewObserver: (viewId) =>
      session.call('viewport.geometry.view.observer.add', [viewId]),
    removeViewObserver: (viewId) =>
      session.call('viewport.geometry.view.observer.remove', [viewId]),
  };
}
