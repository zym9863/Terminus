<script lang="ts">
  import type { BeaconData } from '../lib/supabase/beacons'
  import { calculateEffectiveNoise } from '../lib/supabase/beacons'

  interface Props {
    beacon: BeaconData
    onClose: () => void
  }

  let { beacon, onClose }: Props = $props()

  const GLITCH_CHARS = ''.split('')

  let noise = $derived(calculateEffectiveNoise(beacon))

  let corruptedMessage = $derived.by(() => {
    const chars = beacon.message.split('')
    return chars.map((char) => {
      if (char === ' ') return ' '
      if (Math.random() < noise * 0.8) {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      }
      return char
    }).join('')
  })

  let timeAgo = $derived.by(() => {
    const now = Date.now()
    const created = new Date(beacon.created_at).getTime()
    const hours = Math.floor((now - created) / (1000 * 60 * 60))
    if (hours < 1) return 'JUST NOW'
    if (hours < 24) return `T-${hours}H`
    const days = Math.floor(hours / 24)
    return `T-${days}D`
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.repeat) return
    if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="viewer" onclick={(e) => e.stopPropagation()} role="dialog">
    <div class="viewer-header">
      <span class="title">BEACON_DATA_STREAM</span>
      <span class="status" class:warning={noise > 0.5}>
        {noise > 0.5 ? 'CORRUPTED' : 'STABLE'}
      </span>
    </div>

    <div class="viewer-body">
      <div class="meta-grid">
        <div class="meta-item">
          <span class="label">AUTHOR_ID</span>
          <span class="val">{beacon.author || 'ANONYMOUS'}</span>
        </div>
        <div class="meta-item">
          <span class="label">TIMESTAMP</span>
          <span class="val">{timeAgo}</span>
        </div>
        <div class="meta-item">
          <span class="label">ACCESS_COUNT</span>
          <span class="val">{beacon.view_count.toString().padStart(4, '0')}</span>
        </div>
        <div class="meta-item">
          <span class="label">SIGNAL_DECAY</span>
          <span class="val" class:warning={noise > 0.5}>{Math.floor(noise * 100)}%</span>
        </div>
      </div>

      <div class="message-container">
        <div class="message-label">PAYLOAD:</div>
        <div class="message" style="opacity: {1 - noise * 0.3}">
          {corruptedMessage}
        </div>
      </div>
    </div>

    <div class="actions">
      <div class="close-hint">[ PRESS F OR ESC TO CLOSE CONNECTION ]</div>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 2, 3, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(8px);
  }

  .viewer {
    background: rgba(5, 10, 15, 0.95);
    border: 1px solid var(--color-primary);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.1), inset 0 0 20px rgba(0, 240, 255, 0.05);
    width: 500px;
    max-width: 90vw;
    color: var(--color-text);
    font-family: var(--font-mono);
    position: relative;
    animation: glitch-box 0.2s ease-out;
  }

  .viewer::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--color-primary);
    box-shadow: 0 0 10px var(--color-primary-glow);
  }

  .viewer-header {
    display: flex;
    justify-content: space-between;
    padding: 0.8rem 1.5rem;
    background: rgba(0, 240, 255, 0.1);
    border-bottom: 1px solid var(--color-primary-dim);
    font-size: 0.8rem;
    letter-spacing: 0.1em;
  }

  .title {
    color: var(--color-primary);
    font-weight: bold;
  }

  .status {
    color: var(--color-primary);
  }

  .status.warning {
    color: var(--color-danger);
    animation: blink 1s infinite;
  }

  .viewer-body {
    padding: 2rem 1.5rem;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px dashed var(--color-primary-dim);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .label {
    font-size: 0.65rem;
    color: var(--color-text-dim);
    letter-spacing: 0.1em;
  }

  .val {
    font-size: 0.9rem;
    color: var(--color-primary);
  }

  .val.warning {
    color: var(--color-danger);
    text-shadow: 0 0 5px var(--color-danger-dim);
  }

  .message-container {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-primary-dim);
    padding: 1.5rem;
    position: relative;
  }

  .message-label {
    position: absolute;
    top: -0.6rem;
    left: 1rem;
    background: rgba(5, 10, 15, 0.95);
    padding: 0 0.5rem;
    font-size: 0.7rem;
    color: var(--color-primary);
    letter-spacing: 0.1em;
  }

  .message {
    font-size: 1.1rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text);
    text-shadow: 0 0 2px var(--color-primary-dim);
  }

  .actions {
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid var(--color-primary-dim);
    text-align: center;
  }

  .close-hint {
    font-size: 0.75rem;
    color: var(--color-text-dim);
    letter-spacing: 0.1em;
    animation: pulse 2s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  @keyframes glitch-box {
    0% { transform: scale(0.98) skewX(2deg); opacity: 0; }
    20% { transform: scale(1.02) skewX(-2deg); opacity: 1; }
    40% { transform: scale(0.99) skewX(1deg); }
    60% { transform: scale(1.01) skewX(-1deg); }
    80% { transform: scale(1) skewX(0); }
    100% { transform: scale(1); }
  }
</style>
