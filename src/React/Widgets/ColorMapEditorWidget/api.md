A widget for modifying colormaps.  Allows control of opacity transfer function, range and preset.

## Properties

### initialOpacityMap

This property is the initial value of the opacity transfer function.  It should be a list of objects of the form `{ x: dataValue, y: opacity}` where dataValue is a valid point in the data range and opacity is in the interval [0, 1].

### initialPreset

The name of the default lookup table preset.  See the *presets* property for valid names.

### dataRangeMin

The lowest value that can be set for the range minimum.

### dataRangeMax

The highest value that can be set for the range maximum.

### presets

This is an object with the names an images of each lookup table preset.  `presets['abc']` should be the image for the preset with name `'abc'`.

### onOpacityTransferFunctionChanged

This function will be called whenever the opacity transfer function changes.  It will be passed a list of objects of the form `{ x: dataValue, y: opacity }` where `dataValue` is a number in the current range of the colorMap and `opacity` is a floating point value in the interval [0, 1].

### onPresetChanged

This function will be called when the user chooses a new preset to use.  It will be passed the name of the new preset as a string.

### onRangeEdited

This function will be called when the user manually edits the range of the dataset.  It will be passed an array with two values: the new min and max of the range.

### onScaleRangeToCurrent

This function will be called when the user presses the *Scale Range to Dataset* button.

### onScaleRangeOverTime

This function will be called when the user presses the *Scale Range to Data Over Time* button.
