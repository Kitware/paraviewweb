# LineChart Painter

LineChart Painter allow chart data to be rendered within a Canvas.

The class is imported using the following:

```js
var LineChartPainter = require('paraviewweb/src/Rendering/Painter/LineChartPainter'),
    instance = new LineChartPainter("Display data along x: {x}");
```

## constructor(title, markerColor="#0000FF", colors=["#e1002a", "#417dc0", "#1d9a57", "#e9bc2f", "#9b3880"])

Creates an instance of a LineChartPainter.


## updateData(data)

Update the data to render and emit a PainterReady event.
The data format should be as follow:

```js
{
     xRange: [ 0 , 100],
     fields: [
         { name: 'Temperature', data: [y0, y1, ..., yn]},
         ...
     ]
}
```

## setTitle(title)

Update the title that should be rendered within the Line Chart.

If a String __{x}__ is embedded inside the title, it will be replaced with the
marker location value.

## setMarkerLocation(xRatio)

Set a line marker for the line chart. The value provided should be a fraction
of the range along X. Its value should be within the following range [0.0, 1.0].

## enableMarker(show)

Choose to show or hide the marker.

## isReady() : Boolean

Method that can be used to see if the Painter is ready for painting the data.

## paint(ctx, location)

Method called by the renderer to let the painter fill the given location of the
canvas context.

The location object should be defined as follow:

```js
var location = {
    x: 5,
    y: 10,
    width: 100,
    height: 200
};
```

## onPainterReady(callback)

Method used to register the callback function that should be called when the
painter is ready to be used.

## getControlWidgets() : Array[String...]

Return the list of widgets that should be used to control this painter.
(None for this painter)
