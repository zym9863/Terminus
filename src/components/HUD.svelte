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
    if (!entropy) return 'var(--color-primary)'
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
  <div class="cross-bracket left">[</div>
  <div class="cross-center">+</div>
  <div class="cross-bracket right">]</div>
</div>

<div class="hud-container">
  <div class="hud-top-left">
    <div class="sys-status">SYS.OP.NORMAL</div>
    <div class="coords">
      <span class="label">POS_X</span> <span class="val">{position.x.toFixed(2).padStart(7, ' ')}</span><br>
      <span class="label">POS_Y</span> <span class="val">{position.y.toFixed(2).padStart(7, ' ')}</span><br>
      <span class="label">POS_Z</span> <span class="val">{position.z.toFixed(2).padStart(7, ' ')}</span>
    </div>
  </div>

  <div class="hud-top-right">
    <div class="beacon-sensor">
      <div class="sensor-label">BEACON_PROXIMITY</div>
      <div class="sensor-val">
        <span class="beacon-icon" class:active={nearbyBeacons > 0}></span> 
        {nearbyBeacons.toString().padStart(2, '0')}
      </div>
    </div>
  </div>

  <div class="hud-bottom">
    <div class="entropy-panel">
      <div class="entropy-header">
        <span class="entropy-label">ENTROPY_LEVEL</span>
        <span class="entropy-phase" style="color: {entropyColorStyle}">{entropy?.phaseName ?? 'STABLE'}</span>
        <span class="entropy-val" style="color: {entropyColorStyle}">{entropyPercent.toString().padStart(3, '0')}%</span>
      </div>
      <div class="entropy-track">
        <div
          class="entropy-fill"
          style="width: {entropyPercent}%; background: {entropyColorStyle}; box-shadow: 0 0 10px {entropyColorStyle}"
        ></div>
        <div class="entropy-markers">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>

  {#if showInteractHint}
    <div class="interact-hint">
      <div class="hint-bracket">&lt;</div>
      <div class="hint-text">{showInteractHint}</div>
      <div class="hint-bracket">&gt;</div>
    </div>
  {/if}
</div>

<style>
  .hud-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 20;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    transform-origin: center;
    pointer-events: none;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-primary-glow);
    font-family: var(--font-mono);
    font-size: 1.2rem;
    opacity: 0.8;
    text-shadow: 0 0 5px var(--color-primary);
  }

  .cross-center {
    font-size: 0.8rem;
  }

  .hud-top-left {
    align-self: flex-start;
  }

  .sys-status {
    font-size: 0.7rem;
    color: var(--color-primary);
    margin-bottom: 1rem;
    letter-spacing: 0.1em;
    animation: blink 4s infinite;
  }

  .coords {
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--color-text);
    background: rgba(0, 240, 255, 0.05);
    padding: 0.5rem 1rem;
    border-left: 2px solid var(--color-primary-dim);
  }

  .coords .label {
    color: var(--color-text-dim);
    display: inline-block;
    width: 50px;
  }

  .coords .val {
    color: var(--color-primary);
    text-shadow: 0 0 5px var(--color-primary-dim);
  }

  .hud-top-right {
    position: absolute;
    top: 2rem;
    right: 2rem;
    text-align: right;
  }

  .beacon-sensor {
    background: rgba(0, 240, 255, 0.05);
    padding: 0.5rem 1rem;
    border-right: 2px solid var(--color-primary-dim);
  }

  .sensor-label {
    font-size: 0.6rem;
    color: var(--color-text-dim);
    letter-spacing: 0.1em;
    margin-bottom: 0.2rem;
  }

  .sensor-val {
    font-size: 1.2rem;
    color: var(--color-text);
  }

  .beacon-icon {
    color: var(--color-text-dim);
    margin-right: 0.5rem;
    transition: color 0.3s;
  }

  .beacon-icon.active {
    color: var(--color-primary);
    text-shadow: 0 0 8px var(--color-primary);
    animation: pulse 2s infinite;
  }

  .hud-bottom {
    align-self: center;
    width: 100%;
    max-width: 600px;
    margin-bottom: 2rem;
  }

  .entropy-panel {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-primary-dim);
    padding: 1rem;
    position: relative;
  }

  .entropy-panel::before, .entropy-panel::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid var(--color-primary);
  }

  .entropy-panel::before {
    top: -1px; left: -1px;
    border-right: none; border-bottom: none;
  }

  .entropy-panel::after {
    bottom: -1px; right: -1px;
    border-left: none; border-top: none;
  }

  .entropy-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
  }

  .entropy-label {
    color: var(--color-text-dim);
    letter-spacing: 0.1em;
  }

  .entropy-phase {
    flex-grow: 1;
    text-align: right;
    margin-right: 1rem;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
  }

  .entropy-val {
    font-size: 1.2rem;
    font-weight: bold;
  }

  .entropy-track {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;
  }

  .entropy-fill {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .entropy-markers {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: space-between;
  }

  .entropy-markers span {
    width: 1px;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }

  .interact-hint {
    position: fixed;
    bottom: 8rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--color-primary);
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    background: rgba(0, 240, 255, 0.1);
    padding: 0.5rem 2rem;
    border: 1px solid var(--color-primary-dim);
    animation: pulse 2s ease-in-out infinite;
  }

  .hint-bracket {
    color: var(--color-text-dim);
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes blink {
    0%, 96%, 98% { opacity: 1; }
    97%, 99% { opacity: 0; }
  }
</style>
