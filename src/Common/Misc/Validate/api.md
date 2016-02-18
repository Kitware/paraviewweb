# Validate


```js
import Validate     from 'paraviewweb/src/Common/Misc/Validate';

// The short hand int, dbl, str, bool are not available for direct import.
import { integer, double, string, boolean } from 'paraviewweb/src/Common/Misc/Validate';

Validate.int('hello');
```

## integer(val), int(val)

Return true if val is a valid integer.

## double(val), dbl(val)

Return true if val is a valid double.

## string(val), str(val)

Return true if val is a valid string.

## boolean(val), bool(val)

Return true if val is a valid boolean.
