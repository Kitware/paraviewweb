
precision mediump float;

uniform sampler2D alphaSampler;
uniform sampler2D intensitySampler;
uniform sampler2D orderSampler;
uniform sampler2D lutSampler;

uniform float numberOfLayers;

varying vec2 v_texCoord;


//
// Main shader execution function
//
void main() {
    // Look up the layer number to which this pixel corresponds
    float order = texture2D(orderSampler, v_texCoord).r;
    float alpha = texture2D(alphaSampler, v_texCoord).r;
    float intensity = texture2D(intensitySampler, v_texCoord).r;

    float layerCoord = (order * 255.0) / (numberOfLayers - 1.0);
    vec4 lutColor = texture2D(lutSampler, vec2(layerCoord, 0.5));

    gl_FragColor = vec4(lutColor.rgb * intensity, alpha * lutColor.a);
}
