uniform float uTime;
uniform float uNoise;

varying vec2 vUv;
varying float vNoise;

void main() {
  vUv = uv;
  vNoise = uNoise;

  vec3 pos = position;

  float sway = sin(uTime * 2.0 + pos.y * 0.5) * 0.05 * (1.0 - uNoise);
  pos.x += sway;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
