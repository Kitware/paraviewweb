# AbstractImageBuilder

This AbstractImageBuilder class provides all the basic methods that an ImageBuilder
could need and almost all the methods an ImageBuilder must implement.

## constructor({queryDataModel, pipelineModel, lookupTableManager, handleRecord=false, dimensions=[500,500] })

Keep track of any provided model and create the __controlWidgets__ based on the set of valid ones.


## update()

Standard implementation of data fetching using the __queryDataModel__ instance if any.

```js
if(this.queryDataModel) {
    this.queryDataModel.fetchData();
}
```

## onImageReady(callback) : subscription

Register callback for when the image builder finished its image rendering.

## imageReady(readyImage)

Method that will trigger the ImageReady notification with the provided object.


## registerSubscription(subscription)

Helper method used to automatically __subscription.unsubscribe()__ any registered subscription
when __this.destroy()__ get called.

## registerObjectToFree(obj)

Helper method used to automatically __obj.destroy()__ any registered object
when __this.destroy()__ get called.


## getListeners() : listeners

Return the __QueryDataModel__ MouseListener if a __queryDataModel__ instance
was provided at the creation.


## getControlWidgets() : controlWidgets

Return the control widgets for [ QueryDataModel, PipelineModel, LookupTableManager ]
for only those who were provided at the creation.

## getControlModels() : controlModels

Return the following set of objects.

```js
{
    pipelineModel : this.pipelineModel,
    queryDataModel: this.queryDataModel,
    lookupTableManager: this.lookupTableManager,
    dimensions: this.dimensions
}
```

## destroy()

Will free the registered resources.
