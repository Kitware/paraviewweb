/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
export default function createMethods(session) {
  return {
    getSceneMetaData: (view = -1) => {
      return session.call('viewport.webgl.metadata', [view]);
    },
    getWebGLData: (view_id = -1, object_id, part = 0) => {
      return session.call('viewport.webgl.data', [view_id, object_id, part]);
    },
    getCachedWebGLData: (sha) => {
      return session.call('viewport.webgl.cached.data', [sha]);
    },
    getSceneMetaDataAllTimesteps: (view = -1) => {
      return session.call('viewport.webgl.metadata.alltimesteps', [view]);
    },
  };
}
