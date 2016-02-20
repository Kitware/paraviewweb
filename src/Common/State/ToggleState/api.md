# ToggleState

ToggleState represents a two value state with notification
mechanism when its state change.

The class can be imported with the following command:

```js
import ToggleState from 'paraviewweb/src/Common/State/ToggleState';
```
## constructor(initialState = true)

Return a ToggleState instance.

## setState(value)

Update insternal state and trigger notification if the given
value is different than the current one.

## getState(): boolean

Return the current state.

## toggleState()

Toggle the current state which will trigger a notification.
That method is generated via a closure which allow it to be used
as a callback anywhere without any binding issue with 
invalid **this**.

## onChange(callback):subscription

Register a callback to any possible change of the model.
The callback method profile is as follow.

```js
function(currentBooleanState, envelope){}
```

## destroy()

Free memory and detatch any listener.
