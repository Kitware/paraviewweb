# SizeHelper

This is a set of methods used to handle element size in DOM in an efficient manner.

## getSize(domElement): object

Compute all the size/offset information from the given DOM element or return
a cached version if the window size did not changed since the last request.

## isListening()

Return true only if the SizeHelper has started to listen on Window size change.

## onSizeChange()

Register a callback to be aware when the size of the Window is changing with automatic debouncing.

## onSizeChangeForElement(domElement, callback)

Register a callback to be aware when the size of the given element is changing with automatic debouncing.
It returns a class with single method, "unsubscribe()". The caller must run unsubscribe to stop
listening to the size-change events.

## startListening()

Start listening on Window size change.

## stopListening()

Stop listening on Window size change.

## triggerChange()

Trigger a fake window size change to invalidate cache and trigger any listener.
