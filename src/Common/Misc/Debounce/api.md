# Debounce

This module exposes a helper method used to prevent repetitive calls
by debouncing it.

```js
import Debounce     from 'paraviewweb/src/Common/Misc/Debounce';
import { debounce } from 'paraviewweb/src/Common/Misc/Debounce';

var funcA = Debounce.debounce(invalidateSize, 250);
var funcB = debounce(invalidateSize, 250);
```

## debounce(func, wait, immediate)

Returns a function, that, as long as it continues to be invoked, will not
be triggered. The function will be called after it stops being called for
`wait` milliseconds. If `immediate` is passed, trigger the function on the
leading edge, instead of the trailing.
