/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
export default function createMethods(session) {
  return {
    resetCamera: (view = -1) => {
      return session.call('viewport.camera.reset', [view]);
    },
    updateOrientationAxesVisibility: (view = -1, showAxis = true) => {
      return session.call('viewport.axes.orientation.visibility.update', [
        view,
        showAxis,
      ]);
    },
    updateCenterAxesVisibility: (view = -1, showAxis = true) => {
      return session.call('viewport.axes.center.visibility.update', [
        view,
        showAxis,
      ]);
    },
    updateCamera: (
      view_id = -1,
      focal_point = [0, 0, 0],
      view_up = [0, 1, 0],
      position = [0, 0, 1]
    ) => {
      return session.call('viewport.camera.update', [
        view_id,
        focal_point,
        view_up,
        position,
      ]);
    },
    getCamera: (view_id = -1) => {
      return session.call('viewport.camera.get', [view_id]);
    },
    updateSize: (view_id = -1, width = 500, height = 500) => {
      return session.call('viewport.size.update', [view_id, width, height]);
    },
  };
}
