An react component to edit linear piecewise functions.

## Properties

### rangeMin

The minimum range for points in the piecewise function.  If this property is changed, then onChange will be called with new points that have been rescaled to the new range.

### rangeMax

The maximum range for points in the piecewise function.  If this property is changed, then onChange will be called with new points that have been rescaled to the new range.

### initialPoints

The initial points in the piecewise function.  This property should be an array of objects with each object having x defined as a point in the range [rangeMin, rangeMax] and y in the range [0, 1].  If this is not specified, it is assumed to be `[{ x: rangeMin, y: 0 }, { x: rangeMax, y: 1 }]`.

### onChange

This function will be called with the list of control points for the piecewise function whenever they change.  This includes changes to the range since internally the [rangeMin, rangeMax] is mapped to [0, 1] and changing the range changes the external interpretation of the points.  The function should take a list of the form described above in the initialPoints section.

### visible

True if the widget should be displayed.  False if the widget should be hidden with `display: none`.  Useful when you want the widget to keep listening for range updates even when not shown.
