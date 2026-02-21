<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    onEnter: () => void
  }

  let { onEnter }: Props = $props()
  let visible = $state(true)
  let titleVisible = $state(false)
  let subtitleVisible = $state(false)
  let hintVisible = $state(false)

  onMount(() => {
    setTimeout(() => titleVisible = true, 500)
    setTimeout(() => subtitleVisible = true, 1500)
    setTimeout(() => hintVisible = true, 2500)
  })

  function handleClick() {
    visible = false
    setTimeout(onEnter, 500)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') handleClick()
  }
</script>

{#if visible}
  <div class="loading" onclick={handleClick} onkeydown={handleKeydown} role="button" tabindex="0">
    <h1 class:show={titleVisible}>终焉视界</h1>
    <p class="subtitle" class:show={subtitleVisible}>TERMINUS HORIZON</p>
    <div class="controls" class:show={hintVisible}>
      <p>WASD — 移动 &nbsp;&nbsp; 鼠标 — 视角</p>
      <p>E — 放置信标 &nbsp;&nbsp; F — 查看信标</p>
      <p class="enter">[ 点击进入 ]</p>
    </div>
  </div>
{/if}

<style>
  .loading {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 200;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    color: #aabbdd;
    transition: opacity 0.5s;
  }

  h1 {
    font-size: 4rem;
    font-weight: 100;
    letter-spacing: 1.5rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 1s ease;
    color: #ccddff;
    text-shadow: 0 0 30px rgba(100, 150, 220, 0.2);
  }

  .subtitle {
    font-size: 1rem;
    letter-spacing: 0.8rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 1s ease;
    color: #667799;
    margin-top: 0.5rem;
  }

  .controls {
    margin-top: 4rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 1s ease;
    text-align: center;
    font-size: 0.75rem;
    line-height: 2;
    color: #556677;
  }

  .enter {
    margin-top: 2rem;
    color: #8899bb;
    animation: pulse 2s ease-in-out infinite;
  }

  .show {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.9; }
  }
</style>
