import ColorManager from './ColorManager';
import FileListing from './FileListing';
import KeyValuePairStore from './KeyValuePairStore';
import MouseHandler from './MouseHandler';
import ProgressUpdate from './ProgressUpdate';
import ProxyManager from './ProxyManager';
import SaveData from './SaveData';
import TimeHandler from './TimeHandler';
import ViewPort from './ViewPort';
import ViewPortGeometryDelivery from './ViewPortGeometryDelivery';
import ViewPortImageDelivery from './ViewPortImageDelivery';
import VtkGeometryDelivery from './VtkGeometryDelivery';
import VtkImageDelivery from './VtkImageDelivery';

const protocolsMap = {
  ColorManager,
  FileListing,
  KeyValuePairStore,
  MouseHandler,
  ProgressUpdate,
  ProxyManager,
  SaveData,
  TimeHandler,
  ViewPort,
  ViewPortGeometryDelivery,
  ViewPortImageDelivery,
  VtkGeometryDelivery,
  VtkImageDelivery,
};

export function createClient(connection, protocols = [], customProtocols = {}) {
  const session = connection.getSession();
  const result = {
    connection,
    session,
  };
  let count = protocols.length;

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
