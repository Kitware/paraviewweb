# GeometryDataModel

```javascript
import GeometryDataModel from 'paraviewweb/src/IO/Core/GeometryDataModel';

geometryDataModel = new GeometryDataModel('/dataset');
```

## constructor(basepath)

Create a geometryDataModel instance ready for fetching remote files that
will construct one or many 3D objects.

## loadScene(scene)

The scene object is a JSON structure that describe the setting of the 3D scene
and which piece is needed for what (geometry, topology, fields, objects...).

Here is an example of a scene composed of a single object:

```js
[
    {
        "fields": {
            "ACCL": "fields/ACCL_00ef44b0f987708feb631bb8a82c2a21.Float32Array", 
            "VEL": "fields/VEL_d39000e259b144a63244325378d8496b.Float32Array", 
            "DISPL": "fields/DISPL_a7e4b3b8c7e653562d3fce0b2af72ae7.Float32Array"
        }, 
        "points": "points/7caae253277ef21512ab83c4368d5a33.Float32Array", 
        "name": "Can", 
        "index": "index/94cd4b75ca2a6360686d2f73baa069c5.Uint32Array"
    }
]
```

## onGeometryReady(callback) : subscription

Register callback for when a geometry object become ready. 
(All its data is actually available)

## geometryReady(obj) 

Trigger event with the given geometry.

## colorGeometryBy(objectName, fieldName)

Update the colorBy field of an object. Once the corresponding
color/field data became available (after download), then a
**geometryReady** event get triggered.

