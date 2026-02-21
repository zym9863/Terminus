<script lang="ts">
  import type { EntropyState } from '../lib/entropy/entropy-system'
  import { getEntropyColor } from '../lib/entropy/entropy-system'

  interface Props {
    entropy: EntropyState | null
    position: { x: number; y: number; z: number }
    nearbyBeacons: number
    showInteractHint: string | null
  }

  let { entropy, position, nearbyBeacons, showInteractHint }: Props = $props()

  let entropyColorStyle = $derived.by(() => {
    if (!entropy) return 'rgb(100, 150, 220)'
    const c = getEntropyColor(entropy.value)
    return `rgb(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)})`
  })

  let entropyPercent = $derived(entropy ? Math.floor(entropy.value * 100) : 0)

  let jitterX = $state(0)
  let jitterY = $state(0)

  $effect(() => {
    if (!entropy || entropy.value < 0.3) {
      jitterX = 0
      jitterY = 0
      return
    }
    const interval = setInterval(() => {
      const strength = entropy!.value * 3
      jitterX = (Math.random() - 0.5) * strength
      jitterY = (Math.random() - 0.5) * strength
    }, 50)
    return () => clearInterval(interval)
  })
</script>

<div class="crosshair" style="transform: translate({jitterX}px, {jitterY}px)">
  <div class="cross-h"></div>
  <div class="cross-v"></div>
</div>

<div class="hud-bottom-left">
  <div class="coords">
    X:{position.x.toFixed(1)} Y:{position.y.toFixed(1)} Z:{position.z.toFixed(1)}
  </div>
  <div class="entropy-bar">
    <div class="entropy-label">
      熵 {entropyPercent}% — {entropy?.phaseName ?? '---'}
    </div>
    <div class="entropy-track">
      <div
        class="entropy-fill"
        style="width: {entropyPercent}%; background: {entropyColorStyle}"
      ></div>
    </div>
  </div>
</div>

<div class="hud-top-right">
  <span class="beacon-icon">◈</span> {nearbyBeacons}
</div>

{#if showInteractHint}
  <div class="interact-hint">
    {showInteractHint}
  </div>
{/if}

<style>
  .crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    transform-origin: center;
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

  .entropy-label {
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
    transition: width 0.3s ease, background 0.3s ease;
    border-radius: 2px;
  }

  .hud-top-right {
    position: fixed;
    top: 2rem;
    right: 2rem;
    color: rgba(150, 180, 220, 0.6);
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    pointer-events: none;
    z-index: 20;
  }

  .beacon-icon {
    color: rgba(100, 200, 255, 0.8);
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
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
</style>
