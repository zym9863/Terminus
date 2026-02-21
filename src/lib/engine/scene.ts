import * as THREE from 'three'

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a12)
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.015)

  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.3)
  scene.add(ambient)

  const directional = new THREE.DirectionalLight(0x4a4a8a, 0.8)
  directional.position.set(0, 50, -100)
  scene.add(directional)

  return scene
}
