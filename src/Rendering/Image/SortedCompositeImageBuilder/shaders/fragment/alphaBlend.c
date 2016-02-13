
precision mediump float;

uniform sampler2D underLayerSampler;
uniform sampler2D overLayerSampler;
varying vec2 v_texCoord;

void main() {
    vec4 overColor = texture2D(overLayerSampler, v_texCoord);
    vec3 colA = overColor.rgb;
    float alphA = overColor.a;

    vec4 underColor = texture2D(underLayerSampler, v_texCoord);
    vec3 colB = underColor.rgb;
    float alphB = underColor.a;

    // Well-known "over" operator (A over B, both partially transparent)
    float alphOut = alphA + (alphB * (1.0 - alphA));
    vec3 colOut = ((colA * alphA) + (colB * alphB * (1.0 - alphA))) / alphOut;

    gl_FragColor = vec4(colOut.rgb, alphOut);
}