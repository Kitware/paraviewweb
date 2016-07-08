A widget for modifying colormaps.  Allows control of opacity transfer function, range and preset.  This widget displays the colormap information passed in and provides controls for editing.  However the controls will not work unless the callbacks they trigger set the correct properties on the widget.  This is so that external events (such as changing which colormap is being edited) are free to update these properties as well.

## Properties

### currentOpacityPoints

This property is the current point values of the opacity transfer function.  It should be a list of objects of the form `{ x: dataValue, y: opacity}` where dataValue and opacity are in the interval [0, 1].  The dataValue is mapped into the interval [rangeMin, rangeMax] for display, but in this property should always be in the interal [0, 1]  To properly update the widget it should be set by the function *onOpacityTransferFunctionChanged*.

### currentPreset

The name of the current lookup table preset.  See the *presets* property for valid names.  To properly update the widget it should be set by the function *onPresetChanged*.

### dataRangeMin

The lowest value that can be set for the range minimum.

### dataRangeMax

The highest value that can be set for the range maximum.

### presets

This is an object with the names an images of each lookup table preset.  `presets['abc']` should be the image for the preset with name `'abc'`.

### rangeMin

The current minimum range of the colorMap.  To properly update the widget, it should be set by *onRangeEdited*, *onScaleRangeToCurrent* and *onScaleRangeOverTime*.

### rangeMax

The current maximum range of the colorMap.  To properly update the widget, it should be set by *onRangeEdited*, *onScaleRangeToCurrent* and *onScaleRangeOverTime*.

### onOpacityTransferFunctionChanged

This function will be called whenever the opacity transfer function changes.  It will be passed a list of objects of the form `{ x: dataValue, y: opacity }` where `dataValue` is a number in the current range of the colorMap and `opacity` is a floating point value in the interval [0, 1].  Should update *currentOpacityPoints*.

### onPresetChanged

This function will be called when the user chooses a new preset to use.  It will be passed the name of the new preset as a string. Should update *onPresetChanged*.

### onRangeEdited

This function will be called when the user manually edits the range of the dataset.  It will be passed an array with two values: the new min and max of the range.  Should update *rangeMin* and *rangeMax*.

### onScaleRangeToCurrent

This function will be called when the user presses the *Scale Range to Dataset* button.  Should update *rangeMin* and *rangeMax*.

### onScaleRangeOverTime

This function will be called when the user presses the *Scale Range to Data Over Time* button.  Should update *rangeMin* and *rangeMax*.

### pieceWiseHeight

The height of the piecewise function (opacity map) editor's canvas.  See the height property of the PieceWiseFunctionEditorWidget.

### pieceWiseWidth

The width of the piecewise function (opacity map) editor's canvas.  See the width property of the PieceWiseFunctionEditorWidget.
