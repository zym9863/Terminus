import { createNoise2D } from 'simplex-noise'

export function createSeededNoise(seed: number) {
  const rng = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
  return {
    noise2D: createNoise2D(rng),
  }
}

export interface ChunkContent {
  pillars: { x: number; y: number; z: number; height: number; radius: number }[]
  fragments: { x: number; y: number; z: number; scale: number }[]
  floaters: { x: number; y: number; z: number; size: number }[]
}

export function generateChunkContent(chunkIndex: number, chunkSize: number): ChunkContent {
  const seed = chunkIndex * 73856093
  const { noise2D } = createSeededNoise(seed)
  const baseZ = chunkIndex * chunkSize

  const pillars: ChunkContent['pillars'] = []
  const fragments: ChunkContent['fragments'] = []
  const floaters: ChunkContent['floaters'] = []

  const pillarCount = 3 + Math.floor(Math.abs(noise2D(chunkIndex * 0.1, 0)) * 5)
  for (let i = 0; i < pillarCount; i++) {
    const x = noise2D(i * 1.7, chunkIndex * 0.3) * chunkSize * 0.4
    const z = baseZ + (noise2D(i * 2.3, chunkIndex * 0.7) + 1) * 0.5 * chunkSize
    const height = 2 + Math.abs(noise2D(i * 0.5, chunkIndex)) * 8
    const radius = 0.3 + Math.abs(noise2D(i * 1.1, chunkIndex * 0.2)) * 1.2
    pillars.push({ x, y: height / 2, z: -z, height, radius })
  }

  const fragCount = 8 + Math.floor(Math.abs(noise2D(chunkIndex * 0.2, 1)) * 12)
  for (let i = 0; i < fragCount; i++) {
    const x = noise2D(i * 0.9, chunkIndex * 0.5 + 100) * chunkSize * 0.45
    const z = baseZ + (noise2D(i * 1.5, chunkIndex * 0.8 + 100) + 1) * 0.5 * chunkSize
    const y = 0.2 + Math.abs(noise2D(i * 0.7, chunkIndex + 100)) * 3
    const scale = 0.2 + Math.abs(noise2D(i * 1.3, chunkIndex * 0.4 + 100)) * 0.8
    fragments.push({ x, y, z: -z, scale })
  }

  const floatCount = 5 + Math.floor(Math.abs(noise2D(chunkIndex * 0.3, 2)) * 10)
  for (let i = 0; i < floatCount; i++) {
    const x = noise2D(i * 1.2, chunkIndex * 0.6 + 200) * chunkSize * 0.35
    const z = baseZ + (noise2D(i * 0.8, chunkIndex * 0.9 + 200) + 1) * 0.5 * chunkSize
    const y = 3 + Math.abs(noise2D(i * 0.4, chunkIndex + 200)) * 6
    const size = 0.1 + Math.abs(noise2D(i * 1.6, chunkIndex * 0.3 + 200)) * 0.4
    floaters.push({ x, y, z: -z, size })
  }

  return { pillars, fragments, floaters }
}
