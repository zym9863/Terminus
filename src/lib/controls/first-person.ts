import * as THREE from 'three'
import type { UpdateCallback } from '../engine/loop'

export interface FirstPersonControls {
  enable(): void
  disable(): void
  isLocked(): boolean
  getPosition(): THREE.Vector3
  getDirection(): THREE.Vector3
  update: UpdateCallback
  dispose(): void
}

export function createFirstPersonControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement
): FirstPersonControls {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const moveForward = new THREE.Vector3()
  const moveSide = new THREE.Vector3()

  let locked = false
  const keys: Record<string, boolean> = {}

  const SPEED = 8.0
  const MOUSE_SENSITIVITY = 0.002
  const DAMPING = 8.0

  function onMouseMove(e: MouseEvent) {
    if (!locked) return
    euler.setFromQuaternion(camera.quaternion)
    euler.y -= e.movementX * MOUSE_SENSITIVITY
    euler.x -= e.movementY * MOUSE_SENSITIVITY
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x))
    camera.quaternion.setFromEuler(euler)
  }

  function onKeyDown(e: KeyboardEvent) {
    keys[e.code] = true
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.code] = false
  }

  function onPointerLockChange() {
    locked = document.pointerLockElement === canvas
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  document.addEventListener('pointerlockchange', onPointerLockChange)

  const update: UpdateCallback = (delta) => {
    if (!locked) return

    direction.set(0, 0, 0)
    camera.getWorldDirection(moveForward)
    moveForward.y = 0
    moveForward.normalize()
    moveSide.crossVectors(camera.up, moveForward).normalize()

    if (keys['KeyW'] || keys['ArrowUp']) direction.add(moveForward)
    if (keys['KeyS'] || keys['ArrowDown']) direction.sub(moveForward)
    if (keys['KeyA'] || keys['ArrowLeft']) direction.add(moveSide)
    if (keys['KeyD'] || keys['ArrowRight']) direction.sub(moveSide)

    if (direction.length() > 0) direction.normalize()

    const targetVelocity = direction.multiplyScalar(SPEED)
    velocity.lerp(targetVelocity, 1.0 - Math.exp(-DAMPING * delta))

    camera.position.add(velocity.clone().multiplyScalar(delta))
    camera.position.y = 1.6
  }

  return {
    enable() { canvas.requestPointerLock() },
    disable() { document.exitPointerLock() },
    isLocked: () => locked,
    getPosition: () => camera.position.clone(),
    getDirection: () => {
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      return dir
    },
    update,
    dispose() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    },
  }
}
