# WebGLUtil

This is a utility class used to manipulate GL resources.

```js
var WebGlUtil = require('paraviewweb/src/Common/Misc/WebGl');
```

## showGlInfo(gl)

Print GL information regarding the WebGL context provided.

## createGLResources(gl, glConfig) : glResources

Create and configure all Gl resources described in the configuration using the
provided GL context.

```js
var sampleConfig = {
    programs: {
        displayProgram: {
            vertexShader:   require('./shaders/vertex/basicVertex.c'),
            fragmentShader: require('./shaders/fragment/displayFragment.c'),
            mapping: 'default'
        },
        compositeProgram: {
            vertexShader:   require('./shaders/vertex/basicVertex.c'),
            fragmentShader: require('./shaders/fragment/compositeFragment.c'),
            mapping: 'default'
        }
    },
    resources: {
        buffers: [
            {
                id: 'texCoord',
                data: new Float32Array([
                  0.0,  0.0,
                  1.0,  0.0,
                  0.0,  1.0,
                  0.0,  1.0,
                  1.0,  0.0,
                  1.0,  1.0
                ])
            },{
                id: 'posCoord',
                data: new Float32Array([
                  -1, -1,
                   1, -1,
                  -1,  1,
                  -1,  1,
                   1, -1,
                   1,  1
                ])
            }
        ],
        textures: [
            {
                id: 'texture2D',
                pixelStore: [
                    [ 'UNPACK_FLIP_Y_WEBGL', true ]
                ],
                texParameter: [
                    [ 'TEXTURE_MAG_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_MIN_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_WRAP_S', 'CLAMP_TO_EDGE' ],
                    [ 'TEXTURE_WRAP_T', 'CLAMP_TO_EDGE' ],
                ]
            },{
                id: 'ping',
                pixelStore: [
                    [ 'UNPACK_FLIP_Y_WEBGL', true ]
                ],
                texParameter: [
                    [ 'TEXTURE_MAG_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_MIN_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_WRAP_S', 'CLAMP_TO_EDGE' ],
                    [ 'TEXTURE_WRAP_T', 'CLAMP_TO_EDGE' ],
                ]
            },{
                id: 'pong',
                pixelStore: [
                    [ 'UNPACK_FLIP_Y_WEBGL', true ]
                ],
                texParameter: [
                    [ 'TEXTURE_MAG_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_MIN_FILTER', 'NEAREST' ],
                    [ 'TEXTURE_WRAP_S', 'CLAMP_TO_EDGE' ],
                    [ 'TEXTURE_WRAP_T', 'CLAMP_TO_EDGE' ],
                ]
            }
        ],
        framebuffers: [
            {
                id: 'ping',
                width: this.width,
                height: this.height
            },{
                id: 'pong',
                width: this.width,
                height: this.height
            }
        ]
    },
    mappings: {
        default: [
            { id: 'posCoord', name: 'positionLocation', attribute: 'a_position', format: [ 2, this.gl.FLOAT, false, 0, 0 ] },
            { id: 'texCoord', name: 'texCoordLocation', attribute: 'a_texCoord', format: [ 2, this.gl.FLOAT, false, 0, 0 ] }
        ]
    }
};
```

The returned glResource object will have a __destroy()__ method that let you
free the created resources.

## applyProgramDataMapping(gl, programName, mappingName, glConfig, glResources)

The mapping between buffers and programs is done at creation time but if other
mapping need to be done after the resource creation, this can be performed using
that function.

## TransformShader(shaderString, variableDict, config)

This function can transform shader programs before they are compiled into
a WebGL program in one of several ways.

### String replacement

The variableDict can contain key value mappings and this function will look
for the keys (which must be surrounded by "${" and "}") in the shader string,
and replace them with the values from the dictionary.  For example, if the
variableDict contains the mapping `"MAX_COUNT" -> "7"`, then this function will
look for instances of the string `"${MAX_COUNT}"` in the file and replace them
with the value `"7"`.

String replacement happens before any other kind of shader transformations,
and the result of string replacement is then passed on to the next level of
processing, loop unrolling.

### Loop unrolling

This function can unroll properly annotated loops within a shader source file.
Insert a comment just before and after the loop and then pass
`'inlineLoops': true` in the config argument to get loops unrolled before the
shader source is compiled, but after string replacement has occurred.

The comment preceeding the loop code in the shader source must take the form
`"//@INLINE_LOOP (<variableName>, <minLoopIndex>, <maxLoopIndex>)"`,
where `<minLoopIndex>` is the first loop variable value, and `<maxLoopIndex>`
is the last loop index variable (but is not inclusive).  The comment after
the loop code in the shader must take the form `"//@INLINE_LOOP"` to indicate
the end of the block.

Following is an example of an annotated loop and how it would be unrolled:

GLSL loop code:

```js
//@INLINE_LOOP (loopIdx, 0, 3)
for (int loopIdx = 0; loopIdx < 3; ++loopIdx) {
    if (loopIdx == someVariable) {
        gl_FragColor = texture2D(someSampler[loopIdx], someTexCoord);
    }
}
//@INLINE_LOOP
```

Unrolled loop:

```js
if (0 == someVariable) {
    gl_FragColor = texture2D(someSampler[0], someTexCoord);
}

if (1 == someVariable) {
    gl_FragColor = texture2D(someSampler[1], someTexCoord);
}

if (2 == someVariable) {
    gl_FragColor = texture2D(someSampler[2], someTexCoord);
}
```

### Shader tranformation debugging

In order to get the system to print out the transformed shader to the console
log before compiling, pass `'debug': true` to the `TransformShader` function
within the `config` argument.
