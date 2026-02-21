<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import { createRenderer } from './lib/engine/renderer'
  import { createCamera, handleResize } from './lib/engine/camera'
  import { createScene } from './lib/engine/scene'
  import { createFirstPersonControls } from './lib/controls/first-person'
  import { ChunkManager } from './lib/world/chunk-manager'
  import { createPostProcessing } from './lib/shaders/post-processing'
  import { BeaconRenderer } from './lib/beacons/beacon-renderer'
  import { fetchBeaconsInRange, placeBeacon, incrementBeaconViewCount, subscribeToBeacons } from './lib/supabase/beacons'
  import type { BeaconData } from './lib/supabase/beacons'
  import type { EntropyState } from './lib/entropy/entropy-system'
  import HUD from './components/HUD.svelte'
  import BeaconEditor from './components/BeaconEditor.svelte'
  import BeaconViewer from './components/BeaconViewer.svelte'
  import LoadingScreen from './components/LoadingScreen.svelte'

  let canvas: HTMLCanvasElement
  let entropyState: EntropyState | null = $state(null)
  let isLocked = $state(false)
  let playerPosition = $state({ x: 0, y: 1.6, z: 0 })
  let showEditor = $state(false)
  let showViewer = $state(false)
  let viewingBeacon: BeaconData | null = $state(null)
  let closestBeacon: BeaconData | null = $state(null)
  let nearbyBeaconCount = $state(0)
  let showLoading = $state(true)
  let gameStarted = $state(false)

  let controlsRef: ReturnType<typeof createFirstPersonControls> | null = null
  let beaconRendererRef: BeaconRenderer | null = null
  let lastFetchZ = 0

  function handleEnter() {
    showLoading = false
    gameStarted = true
    if (controlsRef) controlsRef.enable()
  }

  onMount(() => {
    const renderer = createRenderer(canvas)
    const camera = createCamera()
    const scene = createScene()
    const cleanupResize = handleResize(camera, renderer)
    const controls = createFirstPersonControls(camera, canvas)
    controlsRef = controls
    const chunkManager = new ChunkManager(scene)
    const postProcessing = createPostProcessing(renderer, scene, camera)
    const beaconRenderer = new BeaconRenderer(scene)
    beaconRendererRef = beaconRenderer

    const clock = new THREE.Clock()

    // Realtime beacon subscription
    const unsubscribe = subscribeToBeacons((beacon) => {
      beaconRenderer.addBeacon(beacon)
    })

    // Initial beacon fetch
    fetchBeaconsInRange(-200, 10).then((beacons) => {
      for (const b of beacons) beaconRenderer.addBeacon(b)
    })

    // Keyboard handler
    function onKeyDown(e: KeyboardEvent) {
      if (!controls.isLocked()) return

      if (e.code === 'KeyE' && !showEditor && !showViewer) {
        e.preventDefault()
        e.stopPropagation()
        showEditor = true
        controls.disable()
      }

      if (e.code === 'KeyF' && closestBeacon && !showEditor && !showViewer) {
        e.preventDefault()
        e.stopPropagation()
        showViewer = true
        viewingBeacon = closestBeacon
        controls.disable()
        incrementBeaconViewCount(closestBeacon.id)
      }
    }

    document.addEventListener('keydown', onKeyDown)

    // Click to re-lock when game has started
    canvas.addEventListener('click', () => {
      if (gameStarted && !controls.isLocked() && !showEditor && !showViewer && !showLoading) {
        controls.enable()
      }
    })

    function animate() {
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      controls.update(delta, elapsed)
      const pos = controls.getPosition()
      playerPosition = { x: pos.x, y: pos.y, z: pos.z }
      entropyState = chunkManager.update(pos.z, elapsed)
      postProcessing.updateEntropy(entropyState.value, elapsed)
      beaconRenderer.update(elapsed)
      isLocked = controls.isLocked()
      nearbyBeaconCount = beaconRenderer.getBeaconCount()

      // Check for closest beacon
      const closest = beaconRenderer.getClosestBeacon(pos)
      closestBeacon = closest ? closest.beacon : null

      // Fetch more beacons as player moves
      if (Math.abs(pos.z - lastFetchZ) > 100) {
        lastFetchZ = pos.z
        fetchBeaconsInRange(pos.z - 200, pos.z + 50).then((beacons) => {
          for (const b of beacons) beaconRenderer.addBeacon(b)
        })
      }

      postProcessing.composer.render(delta)
    }

    renderer.setAnimationLoop(animate)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      cleanupResize()
      controls.dispose()
      chunkManager.dispose()
      beaconRenderer.dispose()
      postProcessing.dispose()
      unsubscribe()
      renderer.setAnimationLoop(null)
    }
  })

  async function handlePlaceBeacon(message: string, author: string) {
    const pos = playerPosition
    const beacon = await placeBeacon(
      { x: pos.x, y: 0.5, z: pos.z },
      message,
      author || undefined
    )
    if (beacon && beaconRendererRef) {
      beaconRendererRef.addBeacon(beacon)
    }
    showEditor = false
    if (controlsRef) controlsRef.enable()
  }

  function handleCancelEditor() {
    showEditor = false
    if (controlsRef) controlsRef.enable()
  }

  function handleCloseViewer() {
    showViewer = false
    viewingBeacon = null
    if (controlsRef) controlsRef.enable()
  }

  let interactHint = $derived.by(() => {
    if (showEditor || showViewer) return null
    if (closestBeacon) return 'PRESS [F] TO READ BEACON'
    return 'PRESS [E] TO PLACE BEACON'
  })
</script>

<main>
  <canvas bind:this={canvas} id="terminus-canvas"></canvas>

  {#if showLoading}
    <LoadingScreen onEnter={handleEnter} />
  {/if}

  {#if !showLoading && !isLocked && gameStarted && !showEditor && !showViewer}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="paused-overlay" onclick={() => {
      if (controlsRef) controlsRef.enable()
    }}>
      <p>SYSTEM PAUSED</p>
      <p class="sub">[ CLICK TO RESUME ]</p>
    </div>
  {/if}

  {#if isLocked && entropyState}
    <HUD
      entropy={entropyState}
      position={playerPosition}
      nearbyBeacons={nearbyBeaconCount}
      showInteractHint={interactHint}
    />
  {/if}

  {#if showEditor}
    <BeaconEditor onPlace={handlePlaceBeacon} onCancel={handleCancelEditor} />
  {/if}

  {#if showViewer && viewingBeacon}
    <BeaconViewer beacon={viewingBeacon} onClose={handleCloseViewer} />
  {/if}
</main>

<style>
  :global(:root) {
    --color-bg: #020203;
    --color-primary: #00f0ff;
    --color-primary-dim: rgba(0, 240, 255, 0.3);
    --color-primary-glow: rgba(0, 240, 255, 0.8);
    --color-danger: #ff3300;
    --color-danger-dim: rgba(255, 51, 0, 0.3);
    --color-text: #e0f8ff;
    --color-text-dim: #6b8a99;
    --font-mono: 'Share Tech Mono', monospace;
    --font-display: 'Orbitron', sans-serif;
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
    background: var(--color-bg);
    font-family: var(--font-mono);
    color: var(--color-text);
    user-select: none;
  }

  :global(*::selection) {
    background: var(--color-primary);
    color: var(--color-bg);
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

  /* Global CRT Overlay */
  main::after {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    z-index: 999;
    background-size: 100% 2px, 3px 100%;
    pointer-events: none;
    opacity: 0.4;
  }

  .paused-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(2, 2, 3, 0.8);
    backdrop-filter: blur(4px);
    color: var(--color-primary);
    cursor: pointer;
    z-index: 10;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }

  .paused-overlay p {
    font-size: 2rem;
    font-weight: 700;
    text-shadow: 0 0 10px var(--color-primary-glow);
    margin: 0;
    animation: blink 2s infinite;
  }

  .paused-overlay .sub {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-text-dim);
    text-shadow: none;
    margin-top: 1rem;
    letter-spacing: 0.1em;
    animation: none;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
