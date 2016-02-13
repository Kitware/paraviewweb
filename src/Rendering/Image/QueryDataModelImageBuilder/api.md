# QueryDataModelImageBuilder

This is a builder which wrap a QueryDataModel to make it act like an ImageBuilder.

```js
var QueryDataModelImageBuilder = require('paraviewweb/src/Rendering/Image/QueryDataModelImageBuilder'),
    instance = new QueryDataModelImageBuilder(qdm);
```

## constructor(queryDataModel)

Under the hood this will forward any image data.

Below are the two event structures

```js
var eventAsBuffer = {
    canvas: image,
    area: [0, 0, width, height],
    outputSize: [width, height],
    builder: this
};
```

## update() - inherited

Trigger the fetching of the data.

## render()

Trigger a notification if the loaded data is available and decoded.

```js
{
    canvas: image,
    area: [0, 0, width, height],
    outputSize: [width, height],
    builder: this
}
```

## onImageReady(callback) : subscription - inherited

Allows the registration of a __callback(data, envelope)__ function when the
actual generated image is ready.

## getListeners() - inherited

Returns a list of MouseHandler listeners.

## getControlWidgets() - inherited

Returns a list of Widgets needed to drive the ImageBuilder.

## getControlModels() - inherited

Returns a list of Model that can drive the ImageBuilder.

## destroy() - inherited

Free the internal resources of the current instance.
