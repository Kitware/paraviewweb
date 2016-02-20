import ColorManager             from './ColorManager';
import FileListing              from './FileListing';
import MouseHandler             from './MouseHandler';
import ProxyManager             from './ProxyManager';
import TimeHandler              from './TimeHandler';
import ViewPort                 from './ViewPort';
import ViewPortGeometryDelivery from './ViewPortGeometryDelivery';
import ViewPortImageDelivery    from './ViewPortImageDelivery';

const
    protocolsMap = {
        ColorManager,
        FileListing,
        MouseHandler,
        ProxyManager,
        TimeHandler,
        ViewPort,
        ViewPortGeometryDelivery,
        ViewPortImageDelivery,
    };

export function createClient(connection, protocols=[], customProtocols={}) {
    var session = connection.getSession(),
        result = { connection, session },
        count = protocols.length;

    while(count--) {
        const name = protocols[count];
        result[name] = protocolsMap[name](session);
    }

    for(const key in customProtocols) {
        result[key] = customProtocols[key](session);
    }

    return result;
}

export default {
    createClient,
}
