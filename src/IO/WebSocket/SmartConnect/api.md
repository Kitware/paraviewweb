# SmartConnect

{% note warn Deprecated %}
This class has been migrated to [wslink](https://github.com/kitware/wslink)
When all clients have been migrated to wslink, this class will be removed.
{% endnote %}

SmartConnect will try to launch a new remote process
based on the configuration and if that fails or if
a sessionURL is already provided in the configuration
it will establish a direct WebSocket connection using
Autobahn.

## constructor(config) 

Create an instance that will use the provided configuration to
connect itself to a server either by requesting a new remote
process or by trying to directly connecting to it as a fallback.

## connect() 

Trigger the connection request.

## onConnectionReady(callback) : subscription

Register callback for when the connection became ready.

## onConnectionClose(callback) : subscription

Register callback for when the connection close.

## onConnectionError(callback) : subscription

Register callback for when the connection request failed.

## getSession() : session

Return the session associated with the connection.

## destroy() 

Free resources and remove any listener.
