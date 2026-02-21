<script lang="ts">
  import type { BeaconData } from '../lib/supabase/beacons'
  import { calculateEffectiveNoise } from '../lib/supabase/beacons'

  interface Props {
    beacon: BeaconData
    onClose: () => void
  }

  let { beacon, onClose }: Props = $props()

  const GLITCH_CHARS = '█▓░▒╳╬◼◻◾◽■□▪▫'.split('')

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
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="viewer" onclick={(e) => e.stopPropagation()} role="dialog">
    <div class="noise-indicator" style="opacity: {noise}">
      衰减: {Math.floor(noise * 100)}%
    </div>

    <div class="message" style="opacity: {1 - noise * 0.5}">
      {corruptedMessage}
    </div>

    <div class="meta">
      <span>{beacon.author || '匿名'}</span>
      <span>·</span>
      <span>{timeAgo}</span>
      <span>·</span>
      <span>被查看 {beacon.view_count} 次</span>
    </div>

    <div class="close-hint">按 F 或 Esc 关闭</div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(2px);
  }

  .viewer {
    background: rgba(10, 10, 20, 0.95);
    border: 1px solid rgba(80, 140, 220, 0.15);
    border-radius: 8px;
    padding: 2rem;
    width: 420px;
    max-width: 90vw;
    color: #aabbdd;
    font-family: 'Courier New', monospace;
  }

  .noise-indicator {
    font-size: 0.65rem;
    color: #ff6644;
    margin-bottom: 1rem;
  }

  .message {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    word-break: break-word;
    min-height: 3rem;
  }

  .meta {
    font-size: 0.7rem;
    opacity: 0.4;
    display: flex;
    gap: 0.5rem;
  }

  .close-hint {
    margin-top: 1.5rem;
    font-size: 0.65rem;
    opacity: 0.3;
    text-align: center;
  }
</style>
