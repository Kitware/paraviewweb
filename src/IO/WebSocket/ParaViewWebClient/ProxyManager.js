/* eslint-disable arrow-body-style */
export default function createMethods(session) {
  return {
    create: (functionName, parentId = '0') => {
      return session.call('pv.proxy.manager.create', [functionName, parentId]);
    },
    open: (relativePath) => {
      return session.call('pv.proxy.manager.create.reader', [relativePath]);
    },
    get: (proxyId, ui = true) => {
      return session.call('pv.proxy.manager.get', [proxyId, ui]);
    },
    findProxyId: (groupName, proxyName) => {
      return session.call('pv.proxy.manager.find.id', [groupName, proxyName]);
    },
    update: (propsList) => {
      return session.call('pv.proxy.manager.update', [propsList]);
    },
    delete: (proxyId) => {
      return session.call('pv.proxy.manager.delete', [proxyId]);
    },
    list: (viewId = -1) => {
      return session.call('pv.proxy.manager.list', [viewId]);
    },
    available: (type = 'sources') => {
      return session.call('pv.proxy.manager.available', [type]);
    },
    availableSources: () => {
      return session.call('pv.proxy.manager.available', ['sources']);
    },
    availableFilters: () => {
      return session.call('pv.proxy.manager.available', ['filters']);
    },
  };
}
