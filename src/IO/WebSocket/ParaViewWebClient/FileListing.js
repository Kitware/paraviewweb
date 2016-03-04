/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    listServerDirectory: (path = '.') => {
      return session.call('file.server.directory.list', [path]);
    },
  };
}
