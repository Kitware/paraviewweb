# Data Manager

This module allows users to fetch data (JSON, Text, ArrayBuffer, blob) and
cache the result for future use. Additional pattern based URL requests can
be achieved. Images can also be retrieved as a blob and can be display using
a generated browser url.

A new instance is created with:

```javascript
import DataManager from 'paraviewweb/src/IO/Core/DataManager';

dataManager = new DataManager({cacheSize : 1000000000}); // 1 GB by default
```

All listening is managed using [monolog.js](https://www.npmjs.com/package/monologue.js)
and might not be fully described here, consult their full documentation
[here](https://www.npmjs.com/package/monologue.js).

## fetchURL(url, type[, mimeType, topicForNotification])

Fetches a data object from a static URL. The set of possible
data type are: [ 'json', 'text', 'blob', 'array' ]

For the **blob** type, an extra argument is required which is the mimetype of
the blob.

```javascript
var url = '/data/myJsonFile.json';
dataManager.on(url, function(data, envelope) {
    console.log("Got " + data.data.type + " object from " + data.requestedURL + " - last access time: " + data.ts);
    console.log(data.data);
});

dataManager.fetchURL(url, 'json');
```

Then you can optionally provide a topic name that you want your request to be notified on.

## fetch(key, options)

Downloads a resource based on a previously registered pattern
with specific key-value pair replacement.

Here is a full example using that method:

```js
function onJsonData(data, envelope) {

    var jsonObj = data.data;

    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // Access data from JSON object
    console.log(" - str: " + jsonObj.str);
    console.log(" - array: " + jsonObj.array);
    console.log(" - nestedObject.a: " + jsonObj.nestedObject.a);
}

dataManager.registerURL('jsonDataModel', '/data/{name}.json', 'json');
var subscription = dataManager.on('jsonDataModel', onJsonData);
dataManager.fetch('jsonDataModel', { name: 'info'});

// Then to stop listening: subscription.unsubscribe();
```

## get(url[, freeCache])

Returns the downloaded data object if available or an **undefined**
object if unavailable.

The _freeCache_ argument is optional and should be *true* if you want to remove
the given resource from the cache.

The standard returned object will look like the following:

```js
{
    ts: 23423452, // Last access time in milliseconds.
    data: "str" | { json: 'data'} | Blob() | Uint8Array(), // Raw data depending of the fetch data type.
    type: 'text' | 'json' | 'blob' | 'arraybuffer',
    url: ...internal browser url to point to the data..., // This can be use to render images
    requestedURL: '/origin/requested/url'
}
```

## free(url)

Removes the entry from the cache based on the **requestedURL** of a cache entry.

## registerURL(key, urlPattern, type, mimeType)

Registers a pattern based URL to ease data fetching from it.

```js
var pattern = '/data/{ds}/image_{idx}.png';
var key = 'image_ds'
dataManager.registerURL(key, pattern, 'blob', 'image/png');

dataManager.on(key, function(data, envelope) {
    console.log(
        "Got " + data.type + " object from " + data.requestedURL
        + " - last access time: " + data.ts
        + " - usable url: " + data.url);
});

dataManager.fetch(key, { idx: 0, ds: 'temperature' });
dataManager.fetch(key, { idx: 1, ds: 'temperature' });
dataManager.fetch(key, { idx: 2, ds: 'temperature' });
dataManager.fetch(key, { idx: 0, ds: 'pressure' });
dataManager.fetch(key, { idx: 1, ds: 'pressure' });
dataManager.fetch(key, { idx: 2, ds: 'pressure' });
```

## unregisterURL(key)

Removes the pattern from the registry.

## clear()

Empties the content of the cache.

## on(event, listener)

Attaches a listener to a **url** or a pattern key.

Here is a list of possible listener functions:

```js
function onJsonData(data, envelope) {
    var jsonObj = data.data;

    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // Access data from JSON object
    console.log(" - str: " + jsonObj.str);
    console.log(" - array: " + jsonObj.array);
    console.log(" - nestedObject.a: " + jsonObj.nestedObject.a);
}

function onTxtData(data, envelope) {
    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // Replace content inside your DOM
    var strHTML = data.data;
    $('.help').html(strHTML);
}

function onBlobData(data, envelope) {
    var blob = data.data;

    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // The URL let you provide a link to the blob
    console.log(" - Usable URL: " + data.url);
}

function onArrayData(data, envelope) {
    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // Replace content inside your DOM
    var Uint8ArrayObj = data.data;
    // [...]
}

function onImage(data, envelope) {
    var blob = data.data;

    // Print additional cache meta data
    console.log(" - Last read time: " + data.ts);
    console.log(" - Data Type: " + data.type);
    console.log(" - Requested URL: " + data.requestedURL);

    // The URL let you provide a link to the blob
    console.log(" - Usable URL: " + data.url);

    // Update the image in the DOM
    $('.image-to-refresh').attr('src', data.url);
}
```

## getCacheSize()

Return the maximum size that the cache can contain before the gc() take any action.

## setCacheSize( maxSizeInBytes )

Update the maximum cache size to adjust when the garbage collector should empty it.

## getMemoryUsage()

Return the current memory usage of the cache data in Bytes.
