
precision mediump float;

uniform sampler2D orderSampler;
uniform sampler2D normalSampler;
uniform sampler2D layerColorSampler[${SIMULTANEOUS_LAYERS}];
uniform sampler2D lutSampler[${SIMULTANEOUS_LAYERS}];

uniform float layerAlpha[${SIMULTANEOUS_LAYERS}];
uniform vec2 layerRange[${SIMULTANEOUS_LAYERS}];

uniform int orderOffset;

uniform vec4 lightDir;
uniform vec4 lightColor;
uniform vec4 lightTerms;

varying vec2 v_texCoord;

float affine(float inMin, float val, float inMax, float outMin, float outMax) {
    return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

vec4 unpackNormal(vec4 packedNormal) {
    vec4 normal = vec4((packedNormal.xy * 2.0) - 1.0, packedNormal.z, 0.0);
    return normalize(normal);
}

//
// Main shader execution function
//
void main() {
    // Look up the layer number to which this pixel corresponds
    float orderSample = texture2D(orderSampler, v_texCoord).r;
    int order = int(orderSample * 255.0) - orderOffset;

    bool foundOne = false;

    //@INLINE_LOOP (loopIdx, 0, ${SIMULTANEOUS_LAYERS})
    for (int loopIdx = 0; loopIdx < ${SIMULTANEOUS_LAYERS}; ++loopIdx) {
        if (loopIdx == order) {
            float f = texture2D(layerColorSampler[loopIdx], v_texCoord).r;
            if (f >= layerRange[loopIdx][0] && f <= layerRange[loopIdx][1]) {
                // If the scalar value is in range (not NaN) we first do the scalar lookup
                vec2 lutTCoord = vec2(affine(layerRange[loopIdx][0], f, layerRange[loopIdx][1], 0.0, 1.0), 0.5);
                vec4 lutColor = texture2D(lutSampler[loopIdx], lutTCoord);

                // ----------- begin lighting bits ------------

                vec4 packedNormal = texture2D(normalSampler, v_texCoord);
                vec4 normal = unpackNormal(packedNormal);

                float ka = lightTerms[0];
                float kd = lightTerms[1];
                float ks = lightTerms[2];
                float alpha = lightTerms[3];

                vec4 vDir = vec4(0.0, 0.0, 1.0, 0.0);
                vec4 lDir = normalize(lightDir);

                // Calculate ambient term
                vec4 ambientColor = lutColor * ka;

                // This will be used in both diffuse and specular terms
                float lDotN = dot(lDir, normal);

                // Calculate diffuse term
                vec4 diffuseColor = kd * lutColor * lDotN;

                // Calculate specular term
                vec4 R = (normal * 2.0 * lDotN) - lDir;
                float specularTerm = ks * pow(dot(R, vDir), alpha);
                vec4 specularColor = lightColor * specularTerm; // * step(-lDotN, 0.0);

                // Clamp them individually and sum them up
                vec3 fColor = clamp(ambientColor.rgb, 0.0, 1.0) + clamp(diffuseColor.rgb, 0.0, 1.0) + clamp(specularColor.rgb, 0.0, 1.0);

                // ----------- end lighting bits ------------

                foundOne = true;
                gl_FragColor = vec4(fColor.rgb, layerAlpha[loopIdx]);
            }
        }
    }
    //@INLINE_LOOP

    if (foundOne == false) {
        discard;
    }
}
