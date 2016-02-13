
precision mediump float;

uniform sampler2D backgroundSampler;

uniform vec4 backgroundColor;

varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(backgroundSampler, v_texCoord);
    gl_FragColor = vec4(backgroundColor.rgb, color.a);
}
