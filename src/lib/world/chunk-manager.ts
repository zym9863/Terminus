import * as THREE from 'three'
import { Chunk, CHUNK_SIZE } from './chunk'
import { calculateEntropy, type EntropyState } from '../entropy/entropy-system'

const CHUNKS_AHEAD = 5
const CHUNKS_BEHIND = 2

export class ChunkManager {
  private chunks = new Map<number, Chunk>()
  private scene: THREE.Scene
  private currentEntropy: EntropyState

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.currentEntropy = calculateEntropy(0)
  }

  update(playerZ: number, time: number): EntropyState {
    this.currentEntropy = calculateEntropy(playerZ)
    const currentChunkIndex = Math.floor(Math.abs(Math.min(playerZ, 0)) / CHUNK_SIZE)

    const minChunk = Math.max(0, currentChunkIndex - CHUNKS_BEHIND)
    const maxChunk = currentChunkIndex + CHUNKS_AHEAD

    for (let i = minChunk; i <= maxChunk; i++) {
      if (!this.chunks.has(i)) {
        const chunk = new Chunk(i)
        this.chunks.set(i, chunk)
        this.scene.add(chunk.group)
      }
    }

    for (const [index, chunk] of this.chunks) {
      if (index < minChunk || index > maxChunk) {
        this.scene.remove(chunk.group)
        chunk.dispose()
        this.chunks.delete(index)
      }
    }

    for (const [index, chunk] of this.chunks) {
      const chunkZ = -(index * CHUNK_SIZE + CHUNK_SIZE / 2)
      const chunkEntropy = calculateEntropy(chunkZ)
      chunk.updateEntropy(chunkEntropy.value, time)
    }

    return this.currentEntropy
  }

  getEntropy(): EntropyState {
    return this.currentEntropy
  }

  dispose() {
    for (const [, chunk] of this.chunks) {
      this.scene.remove(chunk.group)
      chunk.dispose()
    }
    this.chunks.clear()
  }
}
