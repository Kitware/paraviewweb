An react component to edit linear piecewise functions.

## Properties

### rangeMin

The minimum range for points in the piecewise function.  This is a cosmetic property that affects the display of the x value of the selected point.

### rangeMax

The maximum range for points in the piecewise function.  This is a cosmetic property that affects the display of the x value of the selected point.

### points

The points in the piecewise function.  This property should be an array of objects with each object having x defined as a point in the range [rangeMin, rangeMax] and y in the range [0, 1].  If this is not specified, it is assumed to be `[{ x: 0, y: 0 }, { x: 1, y: 1 }]`.  This property should be kept up to date by listening for updates with the onChange function and updating it when the points change.

### onChange

This function will be called with the list of control points for the piecewise function whenever they change.  The function should take a list of the form described above in the points section.  For the widget to behave properly, the function should set the points property on the widget to keep it up to date with the data.

### height

The height of the canvas to draw the transfer function on.  Will be automatically recomputed whenever the props change if this is set to -1.  Note that this widget also has some controls below the canvas so it will be taller than the given height.  Default: 200

### width

The width of the canvas to draw the piecewise function on.  Will be automatically recomputed whenever the props change if this is set to -1.  Default: -1.

### visible

True if the widget should be displayed.  False if the widget should be hidden with `display: none`.  Default: false.
