# EqualizerState

EqualizerState represents a set of feature list where each feature can
vary in intensity and a color/scalar can be associated with.
This state is used within the React/Widgets/EqualizerWidget.

The class can be imported with the following command:

```js
import EqualizerState from 'paraviewweb/src/Common/State/EqualizerState';
```

## constructor({size=1, colors=['#cccccc'], lookupTable=null, scalars=[]})

Create an instance of an equalizer state.

The size is used to determine how many features should be used. 

The color array will be used by the widget to color each column. 
If the array of colors is smaller than the size, then the widget will
loop through them indefinitely. So that array can contain a single
color without issue.

In case a lookupTable is provided, scalars should be provided as well
so the colors of each feature can be defined based on those scalars and
lookuptable.

## getOpacities(): [0...1]

Return an array of the size given at construction time with values between
0 and 1.

## getColors(): ['#fff']

Return the color table which can be smaller than the actual size of
the equalizer. Unless a lookupTable with scalars are used.

## onChange(callback):subscription

Register a callback to any possible change of the model.
The callback method profile is as follow.

```js
function(equalizerStateInstance, envelope){}
```

## destroy()

Free memory and detatch any listener.
