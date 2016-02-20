# GirderClientBuilder

```js
import GirderClientBuilder from 'paraviewweb/src/IO/Girder/GirderClientBuilder';
GirderClientBuilder.build(...)

or

import { build } from 'paraviewweb/src/IO/Girder/GirderClientBuilder';
build(...)
```

The build function has the following profile:

```js
build(config=location, ...extensions) : clientInstance
```

Which will create Girder client by extracting from the **config** object
the following set of fields

```js
const { protocol, hostname, port, basepath='/api/v1' } = config;
```

And the following set of methods will be available by default without any provided extensions. If any extension is provided, then additional methods will became available along the following ones.

## login(username, password) : Promise

Authenticate yourself and return a Promise.

## logout() : Promise

Logout.

## me() : Promise

Return a promise with your user information.

## isLoggedIn() : Promise

To know is you are logged in or not.

## getLoggedInUser() : object

Return the user cached object (if logged in).

## onAuthChange(callback) : subscription

Register a callback for when the authentication change.

## onBusy(callback) : subscription

Register a callback to be aware when remote call are in progress
or if the client is idle.

## onProgress(callback) : subscription

Register a callback to monitor file upload progress or
any long running request.

## onEvent(callback) : subscription

Register a callback for any server event.

## destroy() 

Free memory and detatch any listener.


