
precision mediump float;

uniform sampler2D compositeSampler;
uniform sampler2D nxSampler;
uniform sampler2D nySampler;
uniform sampler2D nzSampler;
uniform sampler2D scalarSampler;
uniform sampler2D lutSampler;

uniform vec4 viewDir;
uniform vec4 lightDir;
uniform vec4 lightColor;
uniform vec4 lightTerms;

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

        vec4 nx = texture2D(nxSampler, v_texCoord);
        vec4 ny = texture2D(nySampler, v_texCoord);
        vec4 nz = texture2D(nzSampler, v_texCoord);
        vec4 normal = normalize(vec4(convert(nx), convert(ny), convert(nz), 0.0));

        vec4 lutColor = scalarLookup(scalarColor);

        float ka = lightTerms[0];
        float kd = lightTerms[1];
        float ks = lightTerms[2];
        float alpha = lightTerms[3];

        vec4 vDir = normalize(viewDir);
        vec4 lDir = normalize(lightDir);

        // Calculate ambient term
        vec4 ambientColor = lutColor * ka;

        // This will be used in both diffuse and specular terms
        float lDotN = dot(lDir, normal);

        // Adding this check allows us to light whichever side is facing the light
        if (lDotN < 0.0) {
            normal = -1.0 * normal;
            lDotN = dot(lDir, normal);
        }

        // Calculate diffuse term
        vec4 diffuseColor = kd * lutColor * lDotN;

        // Calculate specular term
        vec4 R = (normal * 2.0 * lDotN) - lDir;
        float specularTerm = ks * pow(dot(R, vDir), alpha);
        vec4 specularColor = lightColor * specularTerm; // * step(-lDotN, 0.0);

        // Clamp them individually and sum them up
        vec3 fColor = clamp(ambientColor.rgb, 0.0, 1.0) + clamp(diffuseColor.rgb, 0.0, 1.0) + clamp(specularColor.rgb, 0.0, 1.0);
        gl_FragColor = vec4(fColor.rgb, scalarColor.a);

        // Various debugging outputs

        // gl_FragColor = vec4(ambientColor.rgb, scalarColor.a);
        // gl_FragColor = vec4(diffuseColor.rgb, scalarColor.a);
        // gl_FragColor = vec4(specularColor.rgb, scalarColor.a);
        // gl_FragColor = vec4(lutColor.rgb, scalarColor.a);
        // gl_FragColor = vec4(((normal.rgb + 1.0) / 2.0), scalarColor.a);
    }
}
