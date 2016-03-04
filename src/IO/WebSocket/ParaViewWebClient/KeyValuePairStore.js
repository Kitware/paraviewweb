/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    storeKeyPair: (key, value) => {
      return session.call('pv.keyvaluepair.store', [key, value]);
    },
    retrieveKeyPair: (key) => {
      return session.call('pv.keyvaluepair.retrieve', [key]);
    },
  };
}
