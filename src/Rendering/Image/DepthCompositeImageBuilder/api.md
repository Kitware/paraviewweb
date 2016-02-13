# DepthCompositeImageBuilder

Similar image builder as the CompositeImageBuilder except that it is using WebGL
code based to do the compositing and support different data structures.

```js
var DepthCompositeImageBuilder = require('paraviewweb/src/Rendering/Image/DepthCompositeImageBuilder'),
    instance = new DepthCompositeImageBuilder(queryDataModel, pipelineModel, lookupTableManager);
```

## constructor(queryDataModel, pipelineModel, lookupTableManager)

Create an instance of a DepthCompositeImageBuilder using the associated
__queryDataModel__ that should be used to fetch the data.

And the __pipelineModel__ that should be used for controlling the ImageBuilder.

Under the hood this will create an off-screen canvas for the image generation.

## update() - inherited

Trigger the fetching of the data.

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

## destroy() - inherited

Free the internal resources of the current instance.

## getListeners() - inherited

Returns a list of MouseHandler listeners.

## getControlWidgets() : controlWidgets

Returns a list of Widgets needed to drive the ImageBuilder.

## getControlModels() : controlModels

Returns a list of Model that can drive the ImageBuilder.

