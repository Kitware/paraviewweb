
precision mediump float;

uniform sampler2D compositeSampler;
uniform sampler2D layerSampler;
varying vec2 v_texCoord;

void main() {
    // Sample the texture containing what we have composited so far
    vec4 color = texture2D(compositeSampler, v_texCoord);

    // Sample the new layer to be composited in
    vec4 compColor = texture2D(layerSampler, v_texCoord);

/*
    // Choose the fragment with the greater depth value
    if (color.a > compColor.a) {
        gl_FragColor = color;
    } else {
        gl_FragColor = compColor;
    }
*/

    // Another way to choose the fragment with the greater depth value
    float stepVal = step((compColor.a - color.a), 0.0);
    gl_FragColor = (stepVal * color) + ((1.0 - stepVal) * compColor);

}
