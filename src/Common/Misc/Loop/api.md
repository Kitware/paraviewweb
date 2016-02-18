# Loop

This is module expose an helper method used to loop over an index list in
either direction.

```js
import Loop     from 'paraviewweb/src/Common/Misc/Loop';
import { loop } from 'paraviewweb/src/Common/Misc/Loop';
```

## loop(reverseOrder, count, fn)

fn will be called with an index that go from 0 to (count-1) if reverseOrder is false,
or from (count-1) to 0 if true.
