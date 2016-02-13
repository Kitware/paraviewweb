# PixelOperator

This Image Builder is meant to compute PixelOperation based on data coming
from other ImageBuilder.

```js
var PixelOperatorImageBuilder = require('paraviewweb/src/Rendering/Image/PixelOperatorImageBuilder'),
    instance = new PixelOperatorImageBuilder('a-b', ['a', 'b']);

instance.updateData('a', imageReadyEvent);
instance.updateData('b', imageReadyEvent);
```

## constructor(operation='a-b', dependency=['a','b'])

Create an instance of a PixelOperatorImageBuilder using the pixel operation that
we want to achieve on a set of image data.

Below is the event structure

```js
// setPushMethodAsBuffer()
var imageReadyEvent = {
    canvas: DOMElement,
    area: [0, 0, width, height],
    outputSize: [width, height],
    builder: this
};
```

## setOperation(String)

Update the operation that you would like to perform on each pixel.

The variables name that you can use are the one that have been registered with
the __updateData(name, event)__ method.

## getOperation() : String

Return the operation that was previously set.

## setDependencies(Array[String])

List the data names that you expect in order to perform your pixel operation.
This will prevent invalid execution if all the data was not fully provided.

## updateOperationFunction()

Internal method used to compile the Operation provided as a String.

## updateData(name, imageReadyEvent)

Method that should be called when new data become available for a given
ImageBuilder.

## processData()

Internal method used to trigger the computation of the Pixel Operation.

## onImageReady(callback) : subscription

Allows the registration of a __callback(data, envelope)__ function when the
actual generated image is ready.

## destroy()

Free the internal resources of the current instance.

## getListeners() - inherited

Returns a list of MouseHandler listeners.

## getControlWidgets() - inherited

Returns a list of Widgets needed to drive the ImageBuilder.

## getControlModels() - inherited

Returns a list of Model that can drive the ImageBuilder.
