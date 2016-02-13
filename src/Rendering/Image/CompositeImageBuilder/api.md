# CompositeImageBuilder

This is a builder which creates an ImageBuilder that lets you process composite
datasets. The implementation relies on a single off-screen canvas to generate the
resulting image of a composite structure (rgb.jpg + composite.json).

```js
var CompositeImageBuilder = require('paraviewweb/src/Rendering/Image/CompositeImageBuilder'),
    instance = new CompositeImageBuilder(qdm, pm);
```

## constructor(queryDataModel, pipelineModel)

Create an instance of a CompositeImageBuilder using the associated
__queryDataModel__ that should be used to fetch the data.

And the __pipelineModel__ that should be used for controlling the ImageBuilder.

Under the hood this will create an off-screen canvas for the image generation.
Then, depending if the method setPushMethodAsImage() has been called,
the 'image-ready' notification will not contain the same object.
By default we use the setPushMethodAsBuffer() configuration.

Below are the two event structures

```js
// setPushMethodAsBuffer()
var eventAsBuffer = {
    canvas: DOMElement,
    imageData: ImageDataFromCanvas,
    area: [0, 0, width, height],
    outputSize: [width, height],
    builder: this
};

// setPushMethodAsImage()
var eventAsImage = {
    url: 'data:image/png:ASDGFsdfgsdgf...',
    builder: this
};
```

## update() - inherited

Trigger the fetching of the data (composite.json + rgb.jpg).

## setPipelineQuery(pipelineQuery)

Should be called each time the pipeline setting is changed.

The __pipelineQuery__ is a string that encodes the pipeline configuration such as
which layer is visible or not and which field should be rendered for a given layer.

The __pipelineQuery__ is structured as follows:

```js
var pipelineQuery = "A_BBCAD_EA";

// In that example we have the following setting
var layerSettings = [
    "A_", // Layer A is invisible
    "BB", // Layer B is using field B
    "CA", // Layer C is using field A
    "D_", // Layer D is invisible
    "EA"  // Layer E is using field A
];
```

## render()

Process the current set of loaded data and render it into the background canvas.
Once done, an event gets triggered to let the application know that the image is
ready to be rendered/displayed somewhere.

## onImageReady(callback) : subscription - inherited

Allows the registration of a __callback(data, envelope)__ function when the
actual generated image is ready.

## destroy()

Free the internal resources of the current instance.

## * updateCompositeMap(query, composite)

Internal function used to update the composite map for faster rendering.

## _updateOffsetMap(pipelineQuery)

Internal function used to update the offset map based on the Pipeline configuration.
The __pipelineQuery__ is a String that encode the pipeline configuration such as
which layer is visible or not and which field should be rendered for a given layer.

## _pushToFront(width, height)

Trigger the event notification that the image is ready. This will call the proper
method to either send the ImageData or an ImageURL.

## _pushToFrontAsImage(width, height)

Called as __pushToFront__ when __setPushMethodAsImage()__ is used.

## _pushToFrontAsBuffer(width, height)

Called as __pushToFront__ when __setPushMethodAsBuffer()__ is used.

## getListeners - inherited

Returns a list of MouseHandler listeners.

## getControlWidgets - inherited

Returns a list of Widgets needed to drive the ImageBuilder.

## getControlModels - inherited

Returns a list of Model that can drive the ImageBuilder.
