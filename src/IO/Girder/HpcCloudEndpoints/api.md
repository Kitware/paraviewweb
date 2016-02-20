# HpcCloudEndpoints

A standard Girder instance provide the following set of endpoints.
By adding the one listed here as extension inside a GirderClientBuilder,
you will get the following set of methods:

```js
// Usage example
import CoreEndpoints from 'paraviewweb/src/IO/Girder/CoreEndpoints';
import HpcCloudEndpoints from 'paraviewweb/src/IO/Girder/HpcCloudEndpoints';
import { build } from 'paraviewweb/src/IO/Girder/GirderClientBuilder';

const client = build(location, ...CoreEndpoints, ...HpcCloudEndpoints);
```

## aws
## clusters
## projects
## simulations
## taskflows
