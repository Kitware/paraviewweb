# ImageBuilder Specifications

An ImageBuilder has a goal to build an Image from any kind of data and should
notify its Observer when the actual generated image is ready to be accessed either
for rendering or further processing by another ImageBuilder for example like the
MagicLens one.

## Expected methods

### update()

Request the fetching of new data to render. The render() method will naturally
be called once the data became available.

### render()

Request to generate a new image based on the current set of data loaded.

### destroy()

Free any internal resources.

### onImageReady(callback) : subscription

Register callback to be aware when the image became ready.
The profile of the callback should be as follow:

```js
function( data, envelope ) {
    // The data can be one of those two kinds

    // - Image based
    var data = {
        url: 'data:image/png:ASDGFsdfgsdgf...',
        builder: this
    };

    // - Canvas based (Recommended)
    var data = {
        canvas: DOMElement,
        imageData: ImageDataFromCanvas,
        area: [0, 0, width, height],
        outputSize: [width, height],
        builder: this
    };
```

### getListeners() : listeners

Return listeners for MouseHandler.

### getControlWidgets() : controlWidgets

Return a set of widgets description that should be build in order to control
the given image builder.

### getControlModels() : controlModels

Return a set of control handle for driving the image builder.

## Abstract Implementation

The Abstract implementation of the ImageBuilder provide standard implementation
of most of the methods and just leave out the __render()__ one.

### update()

Will simply call fetchData() on the internal QueryDataModel instance.

### destroy()

Will unsubscribe any registered subscription and destroy and registered object
while turning off() any associated notification callback.

This should be used along with those methods:

- registerSubscription(subscription)
- registerObjectToFree(obj)

### onImageReady(callback) : subscription

Should be used in conjunction with the __imageReady(readyImage)__ method when
you want to publish a new imageReady object.

### getListeners()

Will return the MouseListener of the QueryDataModel instance if any.

### getControlWidgets()

Will return control widgets for LookupTableManager, PipelineMode, QueryDataModel if provided.

### getControlModels()

Return any provided model using the following structure.

```js
return {
    pipelineModel : this.pipelineModel,
    queryDataModel: this.queryDataModel,
    lookupTableManager: this.lookupTableManager,
    dimensions: this.dimensions
};
```
