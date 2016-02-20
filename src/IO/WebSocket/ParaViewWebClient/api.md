# ParaViewWebClient

```js
import ParaViewWebClient from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';
ParaViewWebClient.createClient(...)

or 

import { createClient } from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';
createClient(...)
```

## createClient(connection, protocols=[], customProtocols={}) : client

The provided connection is the one we get from the AutobahnConnection callback
while the protocols is the list of protocol names that we want to enable and the customProtocols would be custom addon that we want to use within our created client.

Available protocols list: 

** ColorManager
** FileListing
** MouseHandler
** ProxyManager
** TimeHandler
** ViewPort
** ViewPortGeometryDelivery
** ViewPortImageDelivery

A custom protocol will be the following form:

```js
var customProtocols = {
    ListFileService: function createMethods(session) {
        return {
            listServerDirectory: (path='.') => {
                return session.call('file.server.directory.list', [ path ]);
            },
        };
    },
    OtherService: function(session) {
        return {
            method1: ...
            method2: ...
        }
    }
}
```
