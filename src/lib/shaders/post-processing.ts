import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import pixelateFragment from './pixelate-shader.glsl'
import scanlineFragment from './scanline-shader.glsl'

const POST_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const pixelatePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uEntropy: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: POST_VERTEX,
    fragmentShader: pixelateFragment,
  })
  composer.addPass(pixelatePass)

  const scanlinePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uEntropy: { value: 0.0 },
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: POST_VERTEX,
    fragmentShader: scanlineFragment,
  })
  composer.addPass(scanlinePass)

  function updateEntropy(entropy: number, time: number) {
    pixelatePass.uniforms.uEntropy.value = entropy
    scanlinePass.uniforms.uEntropy.value = entropy
    scanlinePass.uniforms.uTime.value = time
  }

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    composer.setSize(w, h)
    pixelatePass.uniforms.uResolution.value.set(w, h)
    scanlinePass.uniforms.uResolution.value.set(w, h)
  }

  window.addEventListener('resize', resize)

  return {
    composer,
    updateEntropy,
    dispose() {
      window.removeEventListener('resize', resize)
    },
  }
}
