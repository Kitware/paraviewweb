# PingPong

This is a class defined in the WebGl Util module.

```js
var PingPong = require('paraviewweb/src/Common/Misc/PingPong'),
    instance = new PingPong(gl, [fbo_1, fbo_2], [texture_1, texture_2]);
```

## constructor(glContext, [fbo1, fbo2], [texture1, texture2])

This will bind the framebuffers with the textures.

## swap()

Swap active texture and framebuffer.

## clearFbo()

Clear framebuffers content.

## getFramebuffer() : framebuffer

Return the current active framebuffer.

## getRenderingTexture() : texture

Return the current active texture.
