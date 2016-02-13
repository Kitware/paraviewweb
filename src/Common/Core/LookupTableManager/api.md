# LookupTableManager

```js
var LookupTableManager = require('paraviewweb/src/Common/Core/LookupTableManager'),
    instance = new LookupTableManager();
```

## constructor()

Create an instance of a LookupTableManager.

## addLookupTable(name, range, preset) : LookupTable

Create a new LookupTable for a given name, scalar range and which preset should
be used. If no preset name is provided, the 'spectralflip' preset will be used.

The method will return the newly created LookupTable instance.

## removeLookupTable(name)

Remove the LookupTable instance that was registered under the given name.

## getLookupTable(name)

Return the LookupTable instance that was registered under the given name.

## addFields(fieldsMap)

This will create a LookupTable for each field defined within the map using
the given scalar range.

```js
// fieldsMap can look like that
var fieldsMap = {
    'pressure': [-2, 4],
    'temperature': [20, 28],
    'velocity': [0, 234]
};
```

## onChange(callback) : subscription

Helper method used to bind a listener to the change topic.
This will return a subscription object.

More information can be found on Monologue.js as we rely on it for our
observer methods.

