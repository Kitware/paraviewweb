import ColorManager from './ColorManager';
import FileListing from './FileListing';
import KeyValuePairStore from './KeyValuePairStore';
import MouseHandler from './MouseHandler';
import ProxyManager from './ProxyManager';
import SaveData from './SaveData';
import TimeHandler from './TimeHandler';
import ViewPort from './ViewPort';
import ViewPortGeometryDelivery from './ViewPortGeometryDelivery';
import ViewPortImageDelivery from './ViewPortImageDelivery';

const
  protocolsMap = {
    ColorManager,
    FileListing,
    KeyValuePairStore,
    MouseHandler,
    ProxyManager,
    SaveData,
    TimeHandler,
    ViewPort,
    ViewPortGeometryDelivery,
    ViewPortImageDelivery,
  };

export function createClient(connection, protocols = [], customProtocols = {}) {
  var session = connection.getSession(),
    result = {
      connection, session,
    },
    count = protocols.length;

  while (count) {
    count -= 1;
    const name = protocols[count];
    result[name] = protocolsMap[name](session);
  }

  Object.keys(customProtocols).forEach((key) => {
    result[key] = customProtocols[key](session);
  });

  return result;
}

export default {
  createClient,
};
