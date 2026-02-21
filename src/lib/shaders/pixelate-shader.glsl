uniform sampler2D tDiffuse;
uniform float uEntropy;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  float entropy = uEntropy;

  if (entropy < 0.35) {
    gl_FragColor = texture2D(tDiffuse, vUv);
    return;
  }

  float pixelStrength = smoothstep(0.35, 0.7, entropy);
  float pixelSize = mix(1.0, 16.0, pixelStrength);
  vec2 pixelatedUv = floor(vUv * uResolution / pixelSize) * pixelSize / uResolution;

  vec4 color = texture2D(tDiffuse, pixelatedUv);

  if (entropy > 0.5) {
    float aberration = smoothstep(0.5, 0.9, entropy) * 0.008;
    color.r = texture2D(tDiffuse, pixelatedUv + vec2(aberration, 0.0)).r;
    color.b = texture2D(tDiffuse, pixelatedUv - vec2(aberration, 0.0)).b;
  }

  if (entropy > 0.7) {
    float vignette = smoothstep(0.7, 1.0, entropy);
    float dist = distance(vUv, vec2(0.5));
    color.rgb *= 1.0 - dist * vignette * 1.5;
  }

  gl_FragColor = color;
}
