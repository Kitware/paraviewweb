import RemoteRenderer from '..';
import SizeHelper from '../../../../Common/Misc/SizeHelper';
import SmartConnect from '../../../../IO/WebSocket/SmartConnect';
import ParaViewWebClient from '../../../../IO/WebSocket/ParaViewWebClient';

document.body.style.padding = '0';
document.body.style.margin = '0';

const divRenderer = document.createElement('div');
document.body.appendChild(divRenderer);

divRenderer.style.position = 'relative';
divRenderer.style.width = '100vw';
divRenderer.style.height = '100vh';
divRenderer.style.overflow = 'hidden';

const config = { sessionURL: 'ws://localhost:1234/ws' };
const smartConnect = new SmartConnect(config);
smartConnect.onConnectionReady(connection => {
  const pvwClient = ParaViewWebClient.createClient(connection, ['MouseHandler', 'ViewPort', 'ViewPortImageDelivery']);
  const renderer = new RemoteRenderer(pvwClient);
  renderer.setContainer(divRenderer);
  renderer.onImageReady(() => {
    console.log('We are good');
  });
  window.renderer = renderer;
  SizeHelper.onSizeChange(() => {
    renderer.resize();
  });
  SizeHelper.startListening();
});
smartConnect.connect();
