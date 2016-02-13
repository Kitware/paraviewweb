
precision mediump float;

uniform sampler2D compositeSampler;
uniform sampler2D scalarSampler;
uniform sampler2D lutSampler;

varying vec2 v_texCoord;


float convert(vec4 c) {
    float r = c.r * 255.0;
    float g = c.g * 255.0;
    float b = c.b * 255.0;

    float value = (r * 65536.0) + (g * 256.0) + b;
    return ((value / 16777216.0) * 2.0) - 1.0;
}


vec4 scalarLookup(vec4 c) {
    float r = c.r * 255.0;
    float g = c.g * 255.0;
    float b = c.b * 255.0;

    float value = (r * 65536.0) + (g * 256.0) + b;
    value = value / 16777216.0;

    return texture2D(lutSampler, vec2(value, 0.5));
}


void main() {
    // Sample the texture containing what we have composited so far
    vec4 color = texture2D(compositeSampler, v_texCoord);

    // Sample the new layer to be composited in
    vec4 scalarColor = texture2D(scalarSampler, v_texCoord);

    // Choose the fragment with the greater depth value
    if (color.a > scalarColor.a) {
        gl_FragColor = color;
    } else {
        vec4 lutColor = scalarLookup(scalarColor);
        gl_FragColor = vec4(lutColor.rgb, scalarColor.a);
    }
}
