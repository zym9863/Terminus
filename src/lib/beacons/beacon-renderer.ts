import * as THREE from 'three'
import beaconVertex from '../shaders/beacon-vertex.glsl'
import beaconFragment from '../shaders/beacon-fragment.glsl'
import type { BeaconData } from '../supabase/beacons'
import { calculateEffectiveNoise } from '../supabase/beacons'

const BEACON_HEIGHT = 8
const BEACON_WIDTH = 0.15
const INTERACTION_DISTANCE = 5

export interface BeaconMesh {
  data: BeaconData
  group: THREE.Group
  material: THREE.ShaderMaterial
  effectiveNoise: number
}

export class BeaconRenderer {
  private scene: THREE.Scene
  private beacons = new Map<string, BeaconMesh>()

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  addBeacon(beacon: BeaconData) {
    if (this.beacons.has(beacon.id)) return

    const effectiveNoise = calculateEffectiveNoise(beacon)
    if (effectiveNoise >= 1.0) return

    const geometry = new THREE.PlaneGeometry(BEACON_WIDTH, BEACON_HEIGHT)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNoise: { value: effectiveNoise },
        uColor: { value: new THREE.Color(0x44aaff) },
      },
      vertexShader: beaconVertex,
      fragmentShader: beaconFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const mesh1 = new THREE.Mesh(geometry, material)
    const mesh2 = new THREE.Mesh(geometry.clone(), material)
    mesh2.rotation.y = Math.PI / 2

    const group = new THREE.Group()
    group.add(mesh1)
    group.add(mesh2)
    group.position.set(beacon.position_x, BEACON_HEIGHT / 2, beacon.position_z)

    this.scene.add(group)

    this.beacons.set(beacon.id, {
      data: beacon,
      group,
      material,
      effectiveNoise,
    })
  }

  removeBeacon(id: string) {
    const beacon = this.beacons.get(id)
    if (!beacon) return
    this.scene.remove(beacon.group)
    beacon.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
      }
    })
    beacon.material.dispose()
    this.beacons.delete(id)
  }

  update(time: number) {
    for (const [id, beacon] of this.beacons) {
      beacon.effectiveNoise = calculateEffectiveNoise(beacon.data)
      if (beacon.effectiveNoise >= 1.0) {
        this.removeBeacon(id)
        continue
      }
      beacon.material.uniforms.uTime.value = time
      beacon.material.uniforms.uNoise.value = beacon.effectiveNoise
    }
  }

  getClosestBeacon(
    position: THREE.Vector3
  ): { beacon: BeaconData; distance: number } | null {
    let closest: { beacon: BeaconData; distance: number } | null = null

    for (const [, b] of this.beacons) {
      const beaconPos = new THREE.Vector3(
        b.data.position_x,
        b.data.position_y,
        b.data.position_z
      )
      const dist = position.distanceTo(beaconPos)
      if (dist < INTERACTION_DISTANCE) {
        if (!closest || dist < closest.distance) {
          closest = { beacon: b.data, distance: dist }
        }
      }
    }

    return closest
  }

  getBeaconCount(): number {
    return this.beacons.size
  }

  dispose() {
    for (const [id] of this.beacons) {
      this.removeBeacon(id)
    }
  }
}
