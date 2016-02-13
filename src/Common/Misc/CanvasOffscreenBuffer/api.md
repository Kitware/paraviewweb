# CanvasOffscreenBuffer

This is a utility class used to create an off-screen
canvas for image manipulation.

```js
var CanvasOffscreenBuffer = require('paraviewweb/src/Common/Misc/CanvasOffscreenBuffer'),
    instance = new CanvasOffscreenBuffer(100, 100);
```

## constructor(width, height)

Create a canvas and add it to the DOM as a child of the
`<body/>` element.

## size([width, [height]]) : [ width, height ]

Return the actual canvas size if used without any argument.

If the width and height arguments are provided, this will update the canvas
__width__ and __height__ attributes.

```js
// Get size
var size = instance.size();

// Update size
instance.size(200,500);
```

## get2DContext()

Returns the 2D context of the given canvas.

```js
var ctx = instance.get2DContext();

ctx.fillRect(0,0,10,200);

// ...
```

## get3DContext()

_Experimental_, returns the 3D [WebGL context](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) of the given canvas.

## toDataURL(type='image/png', encoderOptions=1)

Returns a data URI containing a representation of the image in the
format specified by the type parameter (defaults to PNG). The returned image has a resolution of 96 dpi.

- __type__ : A string indicating the image format, the default is image/png.
- __encoderOptions__ : A number between 0 and 1 indicating image quality if the requested type is image/jpeg or image/webp.

## destroy()

Free the internal resources and remove the DOM element from the tree.
