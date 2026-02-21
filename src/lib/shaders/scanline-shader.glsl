uniform sampler2D tDiffuse;
uniform float uEntropy;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);

  if (uEntropy < 0.25) {
    gl_FragColor = color;
    return;
  }

  float strength = smoothstep(0.25, 0.7, uEntropy);

  float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 2.0 - strength);
  color.rgb *= 1.0 - scanline * 0.15 * strength;

  float noise = random(vUv + uTime) * 0.1 * strength;
  color.rgb += noise;

  if (uEntropy > 0.55) {
    float glitchStrength = smoothstep(0.55, 0.85, uEntropy);
    float lineRand = random(vec2(floor(vUv.y * 80.0), floor(uTime * 10.0)));
    if (lineRand > 0.97) {
      float shift = (random(vec2(floor(uTime * 30.0), floor(vUv.y * 50.0))) - 0.5) * 0.05 * glitchStrength;
      color = texture2D(tDiffuse, vUv + vec2(shift, 0.0));
    }
  }

  if (uEntropy > 0.85) {
    float fade = smoothstep(0.85, 1.0, uEntropy);
    color.rgb *= 1.0 - fade;
  }

  gl_FragColor = color;
}
