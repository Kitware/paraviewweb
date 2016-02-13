
precision mediump float;

uniform sampler2D u_image;
varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(color.rgb, 1.0);
}
