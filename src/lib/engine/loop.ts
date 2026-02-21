import * as THREE from 'three'

export type UpdateCallback = (delta: number, elapsed: number) => void

export function createRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const clock = new THREE.Clock()
  const callbacks: UpdateCallback[] = []

  function onUpdate(cb: UpdateCallback) {
    callbacks.push(cb)
    return () => {
      const idx = callbacks.indexOf(cb)
      if (idx !== -1) callbacks.splice(idx, 1)
    }
  }

  function animate() {
    const delta = clock.getDelta()
    const elapsed = clock.getElapsedTime()
    for (const cb of callbacks) {
      cb(delta, elapsed)
    }
    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(animate)

  function dispose() {
    renderer.setAnimationLoop(null)
  }

  return { onUpdate, dispose }
}
