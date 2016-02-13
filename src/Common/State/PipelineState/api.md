# PipelineState

PipelineState represents a pipeline model which is used inside
Widgets and ImageBuilders to keep track of the configuration that should be
used to render an image for a given pipeline configuration.

The class is imported using the following:

```js
var PipelineState = require('paraviewweb/src/Common/State/PipelineState'),
    instance = new PipelineState(json);
```

## constructor(json)

Creates an instance of a pipeline model which keeps track of the
state of the pipeline.
The provided JSON object should have the following type of structure:

```js
{
    "CompositePipeline": {
        "layers": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
        "dimensions": [ 500, 500 ],
        "fields": {
            "A": "salinity",
            "B": "temperature",
            "C": "bottomDepth"
        },
        "layer_fields": {
            "A": [ "C" ],
            "B": [ "B", "A" ],
            "C": [ "B", "A" ],
            "D": [ "B", "A" ],
            "E": [ "B", "A" ],
            "F": [ "B", "A" ],
            "G": [ "B", "A" ],
            "H": [ "B", "A" ],
            "I": [ "B", "A" ],
            "J": [ "B", "A" ],
            "K": [ "B", "A" ]
        },
        "offset": {
            "AC": 1,  "BA": 3,  "BB": 2,  "CA": 5,  "CB": 4,  "DA": 7,  "DB": 6,
            "EA": 9,  "EB": 8,  "FA": 11, "FB": 10, "GA": 13, "GB": 12, "HA": 15,
            "HB": 14, "IA": 17, "IB": 16, "JA": 19, "JB": 18, "KA": 21, "KB": 20
        "pipeline": [
            {
                "ids": [ "A" ],
                "name": "Earth core",
                "type": "layer"
            },
            {
                "children": [
                    {
                        "ids": [ "B" ],
                        "name": "t=5.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "C" ],
                        "name": "t=10.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "D" ],
                        "name": "t=15.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "E" ],
                        "name": "t=20.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "F" ],
                        "name": "t=25.0",
                        "type": "layer"
                    }
                ],
                "ids": [ "B", "C", "D", "E", "F" ],
                "name": "Contour by temperature",
                "type": "directory"
            },
            {
                "children": [
                    {
                        "ids": [ "G" ],
                        "name": "s=34.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "H" ],
                        "name": "s=35.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "I" ],
                        "name": "s=35.5",
                        "type": "layer"
                    },
                    {
                        "ids": [ "J" ],
                        "name": "s=36.0",
                        "type": "layer"
                    },
                    {
                        "ids": [ "K" ],
                        "name": "s=36.5",
                        "type": "layer"
                    }
                ],
                "ids": [ "G", "H", "I", "J", "K" ],
                "name": "Contour by salinity",
                "type": "directory"
            }
        ]
    }
}
```

## onChange(callback) : subscription

Callback function will be called with the pipeline query as the first argument.
As we rely on Monologue.js, you get a subscription object as a
response which allows for easy unsubscription.

## TopicChange() : 'pipeline.change'

Returns the name of the topic used for the pipeline change notification.

## triggerChange()

Triggers a change event. The event triggered is a string
that represents the pipeline encoding.

## isLayerActive(layerId) : Boolean

Returns true if the given layer is set to active.
By default, every layer is active.

## setLayerActive(layerId, active)

Updates the active state of a layer.
If the internal state has changed, the model will trigger a change event.

## toggleLayerActive(layerId)

Toggles the active state of the given layer and trigger a change event.

## isLayerVisible(layerId)

Returns true if the given layer is set to visible. By default, every layer is visible.

## setLayerVisible(layerId, visible)

Updates the visible state of a layer.
If the internal state has changed, the model will trigger a change event.

## toggleLayerVisible(layerId)

Toggles the visible state of the given layer and triggers a change event.

## isLayerInEditMode(layerId)

Returns true if the given layer is in edit mode. By default, none of the layers are in edit mode.

## toggleEditMode(layerId)

Toggles the edit mode state of the given layer and triggers a change event.

## getColor(layerId) : Array

Returns the set of color codes that given layer can have.

```js
getColor('E') => ['B', 'A']
```

## getColorToLabel(colorCode) : String

Returns the label associated to a given color code.

```js
getColorToLabel('B') => 'temperature'
```

## isActiveColor(layerId, colorCode) : Boolean

Returns true if the given layer is colored by the
given color code, returns false otherwise.

## setActiveColor(layerId, colorCode)

Updates which __ColorBy__ field should be used for a given layer.

## getPipelineQuery() : String

Returns the current pipeline configuration as an encoded string.

## getPipelineDescription()

Returns the pipeline tree defined inside the JSON object under the path __JSON.CompositePipeline.pipeline__.
