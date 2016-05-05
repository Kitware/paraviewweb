
```js
var LinearPieceWiseEditor = require('paraviewweb/src/NativeUI/Canvas/LinearPieceWiseEditor'),
    instance = new LinearPieceWiseEditor(document.querySelector('canvas'));
```

### constructor(canvas, style): instance

Create new instance and bind it to the given canvas or wait for one provided by a later call to **setContainer**.

### resetControlPoints()

Reset control points to [{ x:0.0, y:0.0 }, { x:1.0, y:1.0 }];

### setControlPoints(newPoints)

Set control points to the given list of points.  The list should be similar to the one above in the description of **resetControlPoints**.  It should be a list of objects with x and y attributes where x and y have a valid range of [0, 1].

### setStyle({ radius = 6, stroke = 2, color = '#000000', activePointColor = '#EE3333', fillColor = '#ccc' } = {})

Update rendering style:

-- radius: Radius size in pixels for the control point.
-- stroke: Line width in pixel for the line connecting the control points.
-- color: Color used for the lines and circles.
-- activePointColor: Color used for the active point
-- fillColor: Background color.

### setActivePoint(index)

Sets the active point given its index.  The index of the active point can be obtained via the
activeIndex property on the LinearPieceWiseEditor.  The active point by default is the last
point the user added/modified and is colored differently than the other points.

### clearActivePoint()

Clears the active point so that no points are active.

### setContainer(canvas)

Update the binding of the instance to a canvas.
The given canvas can be set to **null** to detach the current instance without destroying it.

### render()

Method automatically called with mouse interaction which will trigger the painting of the canvas and the triggering of the **onChange** event.

### onChange(callback) : subscription

Attach a change listener when the **controlPoints** change.

```js
var subscription = instance.onChange((ctrlPts, envelope) => {
  console.log('Updated control points', ctrlPts);
})

// later
subscription.unsubscribe();
subscription = null;
```

### destroy()

Free memory and associated resources like mouse listener.
