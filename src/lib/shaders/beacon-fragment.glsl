uniform float uTime;
uniform float uNoise;
uniform vec3 uColor;

varying vec2 vUv;
varying float vNoise;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 color = uColor;

  float glow = 1.0 - uNoise * 0.8;

  if (uNoise > 0.3) {
    float flicker = sin(uTime * 15.0 + vUv.y * 20.0) * 0.5 + 0.5;
    glow *= mix(1.0, flicker, smoothstep(0.3, 0.7, uNoise));
  }

  if (uNoise > 0.5) {
    float noise = random(vUv + uTime * 0.5) * smoothstep(0.5, 1.0, uNoise);
    color = mix(color, vec3(noise), smoothstep(0.5, 0.9, uNoise) * 0.5);
  }

  float centerDist = abs(vUv.x - 0.5) * 2.0;
  float beam = 1.0 - centerDist * centerDist;
  glow *= beam;

  if (uNoise > 0.9) {
    glow *= 1.0 - smoothstep(0.9, 1.0, uNoise);
  }

  gl_FragColor = vec4(color * glow, glow * 0.8);
}
