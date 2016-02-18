# Convert

This is a set of methods used to convert primary types.

```js
import Convert             from 'paraviewweb/src/Common/Misc/Convert';
import { string, boolean } from 'paraviewweb/src/Common/Misc/Convert';

if( boolean(value) && Convert.boolean(value) ) {
    // Both condition are similar
}
```

## integer(val)

Return an integer from a string.

## double(val)

Return a double from a string.

## string(val)

Convert the object to a string.
  
## boolean(val)

Return a boolean (true, false, 1, 0...)
