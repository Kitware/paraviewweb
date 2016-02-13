
precision mediump float;

uniform sampler2D orderSampler;
uniform sampler2D intensitySampler;
uniform sampler2D layerColorSampler[${SIMULTANEOUS_LAYERS}];
uniform sampler2D lutSampler[${SIMULTANEOUS_LAYERS}];

uniform float layerAlpha[${SIMULTANEOUS_LAYERS}];
uniform vec2 layerRange[${SIMULTANEOUS_LAYERS}];

uniform int orderOffset;

varying vec2 v_texCoord;

float affine(float inMin, float val, float inMax, float outMin, float outMax) {
    return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

//
// Main shader execution function
//
void main() {
    // Look up the layer number to which this pixel corresponds
    float orderSample = texture2D(orderSampler, v_texCoord).r;
    int order = int(orderSample * 255.0) - orderOffset;

    float intensity = texture2D(intensitySampler, v_texCoord).r;
    bool foundOne = false;

    //@INLINE_LOOP (loopIdx, 0, ${SIMULTANEOUS_LAYERS})
    for (int loopIdx = 0; loopIdx < ${SIMULTANEOUS_LAYERS}; ++loopIdx) {
        if (loopIdx == order) {
            float f = texture2D(layerColorSampler[loopIdx], v_texCoord).r;
            if (f >= layerRange[loopIdx][0] && f <= layerRange[loopIdx][1]) {
                vec2 lutTCoord = vec2(affine(layerRange[loopIdx][0], f, layerRange[loopIdx][1], 0.0, 1.0), 0.5);
                vec4 color = texture2D(lutSampler[loopIdx], lutTCoord);
                gl_FragColor = vec4(color.xyz * intensity, layerAlpha[loopIdx]);
                foundOne = true;
            }
        }
    }
    //@INLINE_LOOP

    if (foundOne == false) {
        discard;
    }
}
