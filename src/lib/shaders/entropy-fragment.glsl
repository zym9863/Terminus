uniform float uEntropy;
uniform float uTime;
uniform vec3 uBaseColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vEntropy;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 color = uBaseColor;
  vec3 lightDir = normalize(vec3(0.3, 1.0, -0.5));
  float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
  color *= 0.3 + 0.7 * diffuse;

  if (uEntropy > 0.2) {
    float weathering = smoothstep(0.2, 0.4, uEntropy);
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), weathering * 0.7);
    float noise = random(vUv * 100.0 + uTime) * 0.15 * weathering;
    color += noise;
  }

  if (uEntropy > 0.4) {
    float glitchStrength = smoothstep(0.4, 0.8, uEntropy);
    float offset = glitchStrength * 0.05;
    color.r = color.r + random(vUv + uTime * 0.1) * offset;
    color.b = color.b - random(vUv - uTime * 0.1) * offset;
  }

  if (uEntropy > 0.6) {
    float glitchBand = step(0.97, random(vec2(floor(vWorldPosition.y * 10.0), uTime * 5.0)));
    color = mix(color, vec3(random(vUv + uTime), 0.0, random(vUv - uTime)), glitchBand * smoothstep(0.6, 0.8, uEntropy));
  }

  if (uEntropy > 0.8) {
    float dissolve = smoothstep(0.8, 1.0, uEntropy);
    float noise = random(vUv * 50.0 + uTime * 2.0);
    if (noise < dissolve * 0.8) discard;
    color *= 1.0 - dissolve * 0.9;
  }

  gl_FragColor = vec4(color, 1.0);
}
