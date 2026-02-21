import * as THREE from 'three'
import { createEntropyMaterial } from '../shaders/entropy-material'
import { generateChunkContent } from './procedural'

export const CHUNK_SIZE = 30

const COLORS = [
  new THREE.Color(0x4a6fa5),
  new THREE.Color(0x7b8ea0),
  new THREE.Color(0x5c7a99),
  new THREE.Color(0x8896a7),
  new THREE.Color(0x3d5a80),
]

export class Chunk {
  readonly index: number
  readonly group: THREE.Group
  readonly materials: THREE.ShaderMaterial[] = []
  private disposed = false

  constructor(index: number) {
    this.index = index
    this.group = new THREE.Group()
    this.group.name = `chunk-${index}`
    this.buildGeometry()
  }

  private buildGeometry() {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE)
    const groundColor = new THREE.Color(0x1a1a2e)
    const groundMat = createEntropyMaterial(groundColor)
    this.materials.push(groundMat)
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, 0, -(this.index * CHUNK_SIZE + CHUNK_SIZE / 2))
    this.group.add(ground)

    const content = generateChunkContent(this.index, CHUNK_SIZE)

    for (const p of content.pillars) {
      const geo = new THREE.CylinderGeometry(p.radius, p.radius * 1.2, p.height, 6)
      const color = COLORS[Math.floor(Math.abs(p.x * 100) % COLORS.length)]
      const mat = createEntropyMaterial(color)
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(p.x, p.y, p.z)
      this.group.add(mesh)
    }

    for (const f of content.fragments) {
      const geo = new THREE.BoxGeometry(f.scale, f.scale * 0.6, f.scale * 0.8)
      const color = COLORS[Math.floor(Math.abs(f.z * 50) % COLORS.length)]
      const mat = createEntropyMaterial(color)
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(f.x, f.y, f.z)
      mesh.rotation.set(f.x * 0.5, f.z * 0.3, f.y * 0.7)
      this.group.add(mesh)
    }

    for (const fl of content.floaters) {
      const geo = new THREE.IcosahedronGeometry(fl.size, 0)
      const color = new THREE.Color(0x6688cc)
      const mat = createEntropyMaterial(color)
      mat.transparent = true
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(fl.x, fl.y, fl.z)
      this.group.add(mesh)
    }
  }

  updateEntropy(entropy: number, time: number) {
    for (const mat of this.materials) {
      mat.uniforms.uEntropy.value = entropy
      mat.uniforms.uTime.value = time
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.ShaderMaterial) {
          obj.material.dispose()
        }
      }
    })
  }
}
