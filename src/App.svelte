<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import { createRenderer } from './lib/engine/renderer'
  import { createCamera, handleResize } from './lib/engine/camera'
  import { createScene } from './lib/engine/scene'
  import { createFirstPersonControls } from './lib/controls/first-person'
  import { ChunkManager } from './lib/world/chunk-manager'
  import { createPostProcessing } from './lib/shaders/post-processing'
  import type { EntropyState } from './lib/entropy/entropy-system'

  let canvas: HTMLCanvasElement
  let entropyState: EntropyState | null = $state(null)
  let isLocked = $state(false)
  let playerPosition = $state({ x: 0, y: 1.6, z: 0 })

  onMount(() => {
    const renderer = createRenderer(canvas)
    const camera = createCamera()
    const scene = createScene()
    const cleanupResize = handleResize(camera, renderer)
    const controls = createFirstPersonControls(camera, canvas)
    const chunkManager = new ChunkManager(scene)
    const postProcessing = createPostProcessing(renderer, scene, camera)

    const clock = new THREE.Clock()

    function animate() {
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      controls.update(delta, elapsed)
      const pos = controls.getPosition()
      playerPosition = { x: pos.x, y: pos.y, z: pos.z }
      entropyState = chunkManager.update(pos.z, elapsed)
      postProcessing.updateEntropy(entropyState.value, elapsed)
      isLocked = controls.isLocked()

      postProcessing.composer.render(delta)
    }

    renderer.setAnimationLoop(animate)

    canvas.addEventListener('click', () => {
      if (!controls.isLocked()) controls.enable()
    })

    return () => {
      cleanupResize()
      controls.dispose()
      chunkManager.dispose()
      postProcessing.dispose()
      renderer.setAnimationLoop(null)
    }
  })
</script>

<main>
  <canvas bind:this={canvas} id="terminus-canvas"></canvas>

  {#if !isLocked}
    <div class="overlay">
      <h1 class="title">终焉视界</h1>
      <p class="subtitle">TERMINUS HORIZON</p>
      <p class="hint">点击进入</p>
    </div>
  {/if}

  {#if isLocked && entropyState}
    <div class="hud-bottom-left">
      <div class="coords">
        X:{playerPosition.x.toFixed(1)} Y:{playerPosition.y.toFixed(1)} Z:{playerPosition.z.toFixed(1)}
      </div>
      <div class="entropy-info">
        熵 {Math.floor(entropyState.value * 100)}% — {entropyState.phaseName}
      </div>
      <div class="entropy-track">
        <div
          class="entropy-fill"
          style="width: {entropyState.value * 100}%"
        ></div>
      </div>
    </div>

    <div class="crosshair">
      <div class="cross-h"></div>
      <div class="cross-v"></div>
    </div>

    <div class="interact-hint">
      按 E 放置信标
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
    font-family: 'Courier New', monospace;
  }

  main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  #terminus-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    color: #8899bb;
    cursor: pointer;
    z-index: 10;
  }

  .title {
    font-size: 4rem;
    font-weight: 100;
    letter-spacing: 1.5rem;
    margin-bottom: 0.5rem;
    color: #aabbdd;
    text-shadow: 0 0 20px rgba(100, 150, 220, 0.3);
  }

  .subtitle {
    font-size: 1rem;
    letter-spacing: 0.8rem;
    opacity: 0.5;
    margin-bottom: 3rem;
  }

  .hint {
    font-size: 0.9rem;
    opacity: 0.4;
    animation: pulse 2s ease-in-out infinite;
  }

  .crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 20;
  }

  .cross-h, .cross-v {
    position: absolute;
    background: rgba(200, 220, 255, 0.5);
  }

  .cross-h {
    width: 16px;
    height: 1px;
    top: 0;
    left: -8px;
  }

  .cross-v {
    width: 1px;
    height: 16px;
    top: -8px;
    left: 0;
  }

  .hud-bottom-left {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    color: rgba(150, 180, 220, 0.7);
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    pointer-events: none;
    z-index: 20;
  }

  .coords {
    margin-bottom: 0.5rem;
    opacity: 0.6;
  }

  .entropy-info {
    margin-bottom: 0.3rem;
  }

  .entropy-track {
    width: 200px;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .entropy-fill {
    height: 100%;
    background: linear-gradient(to right, #4488ff, #ff4444);
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  .interact-hint {
    position: fixed;
    bottom: 6rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(180, 200, 230, 0.6);
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    pointer-events: none;
    z-index: 20;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }
</style>
