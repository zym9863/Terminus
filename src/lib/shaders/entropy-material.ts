import * as THREE from 'three'
import entropyVertex from './entropy-vertex.glsl'
import entropyFragment from './entropy-fragment.glsl'

export function createEntropyMaterial(baseColor: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uEntropy: { value: 0.0 },
      uTime: { value: 0.0 },
      uBaseColor: { value: baseColor },
    },
    vertexShader: entropyVertex,
    fragmentShader: entropyFragment,
    side: THREE.DoubleSide,
  })
}

export function updateEntropyMaterials(
  materials: THREE.ShaderMaterial[],
  entropy: number,
  time: number
) {
  for (const mat of materials) {
    mat.uniforms.uEntropy.value = entropy
    mat.uniforms.uTime.value = time
  }
}
