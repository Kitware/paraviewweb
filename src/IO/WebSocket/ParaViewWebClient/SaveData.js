/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    saveData: (filePath, options = {}) => {
      return session.call('pv.data.save', [filePath, options]);
    },
  };
}
