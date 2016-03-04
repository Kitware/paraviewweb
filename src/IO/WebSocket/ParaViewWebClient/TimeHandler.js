/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    updateTime: (action) => {
      return session.call('pv.vcr.action', [action]);
    },
    next: () => {
      return session.call('pv.vcr.action', ['next']);
    },
    previous: () => {
      return session.call('pv.vcr.action', ['prev']);
    },
    first: () => {
      return session.call('pv.vcr.action', ['first']);
    },
    last: () => {
      return session.call('pv.vcr.action', ['last']);
    },

    setTimeStep: (idx) => {
      return session.call('pv.time.index.set', [idx]);
    },

    getTimeStep: () => {
      return session.call('pv.time.index.get', []);
    },

    setTimeValue: (t) => {
      return session.call('pv.time.value.set', [t]);
    },

    getTimeValue: () => {
      return session.call('pv.time.value.get', []);
    },

    getTimeValues: () => {
      return session.call('pv.time.values', []);
    },

    play: (deltaT = 0.1) => {
      return session.call('pv.time.play', [deltaT]);
    },

    stop: () => {
      return session.call('pv.time.stop', []);
    },
  };
}
