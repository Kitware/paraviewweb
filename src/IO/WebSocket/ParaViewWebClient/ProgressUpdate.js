/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    onProgressUpdate: (callback) =>
      session.subscribe('paraview.progress', callback),
  };
}
