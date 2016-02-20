# AutobahnConnection

## constructor(urls, secret="vtkweb-secret")

Create an instance of Autobahn conenction. The urls can either
be a single url (string) or a list of urls such as WebSocket and http
for long-polling fallback.

Usually with a ProcessLauncher we will set the **urls** to **connection.sessionURL**.

## connect() 

Trigger the actual connection request with the server.

## onConnectionReady(callback) : subscription

Register callback for when the connection became ready.

## onConnectionClose(callback) : subscription

Register callback for when the connection close.

## getSession() : object

Return null if the connection is not yet established or the session
for making RPC calls.

## destroy(timeout=10)

Close the connection and ask the server to automaticaly shutdown
after the given timeout while removing any listener.
