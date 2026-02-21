<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    onEnter: () => void
  }

  let { onEnter }: Props = $props()
  let visible = $state(true)
  let bootSequence = $state<string[]>([])
  let titleVisible = $state(false)
  let subtitleVisible = $state(false)
  let hintVisible = $state(false)

  const bootLogs = [
    "INITIALIZING TERMINUS PROTOCOL...",
    "LOADING ENTROPY ENGINE [OK]",
    "CONNECTING TO BEACON NETWORK [OK]",
    "CALIBRATING SENSORS [OK]",
    "WARNING: HIGH ENTROPY DETECTED",
    "SYSTEM READY."
  ]

  onMount(() => {
    let delay = 0;
    bootLogs.forEach((log, i) => {
      delay += Math.random() * 300 + 100;
      setTimeout(() => {
        bootSequence = [...bootSequence, log];
      }, delay);
    });

    setTimeout(() => titleVisible = true, delay + 500)
    setTimeout(() => subtitleVisible = true, delay + 1000)
    setTimeout(() => hintVisible = true, delay + 1500)
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
    <div class="boot-logs">
      {#each bootSequence as log}
        <div class="log-line">{log}</div>
      {/each}
    </div>

    <div class="title-container">
      <h1 class:show={titleVisible} data-text="终焉视界">终焉视界</h1>
      <p class="subtitle" class:show={subtitleVisible}>TERMINUS HORIZON</p>
    </div>

    <div class="controls" class:show={hintVisible}>
      <div class="control-grid">
        <div class="key">W A S D</div><div class="desc">MOVE</div>
        <div class="key">MOUSE</div><div class="desc">LOOK</div>
        <div class="key">E</div><div class="desc">PLACE BEACON</div>
        <div class="key">F</div><div class="desc">READ BEACON</div>
      </div>
      <p class="enter">[ CLICK TO INITIALIZE ]</p>
    </div>
  </div>
{/if}

<style>
  .loading {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 200;
    cursor: pointer;
    font-family: var(--font-mono);
    color: var(--color-primary);
    transition: opacity 0.5s;
  }

  .boot-logs {
    position: absolute;
    top: 2rem;
    left: 2rem;
    font-size: 0.8rem;
    color: var(--color-text-dim);
    text-align: left;
    width: 100%;
  }

  .log-line {
    margin-bottom: 0.2rem;
    animation: type 0.1s steps(40, end);
  }

  .title-container {
    text-align: center;
    position: relative;
  }

  h1 {
    font-family: var(--font-display);
    font-size: 5rem;
    font-weight: 900;
    letter-spacing: 1rem;
    margin: 0;
    opacity: 0;
    color: var(--color-text);
    text-shadow: 0 0 20px var(--color-primary-glow), 0 0 40px var(--color-primary-dim);
    position: relative;
  }

  h1.show {
    opacity: 1;
    animation: glitch 3s infinite;
  }

  h1::before, h1::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.8;
  }

  h1::before {
    left: 2px;
    text-shadow: -2px 0 var(--color-danger);
    clip: rect(24px, 550px, 90px, 0);
    animation: glitch-anim-2 3s infinite linear alternate-reverse;
  }

  h1::after {
    left: -2px;
    text-shadow: -2px 0 var(--color-primary);
    clip: rect(85px, 550px, 140px, 0);
    animation: glitch-anim 2.5s infinite linear alternate-reverse;
  }

  .subtitle {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    letter-spacing: 1rem;
    opacity: 0;
    color: var(--color-primary);
    margin-top: 1rem;
    text-shadow: 0 0 10px var(--color-primary-glow);
  }

  .controls {
    margin-top: 5rem;
    opacity: 0;
    text-align: center;
  }

  .control-grid {
    display: grid;
    grid-template-columns: auto auto;
    gap: 1rem 2rem;
    text-align: left;
    margin-bottom: 3rem;
    border: 1px solid var(--color-primary-dim);
    padding: 2rem;
    background: rgba(0, 240, 255, 0.02);
    box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);
  }

  .key {
    color: var(--color-text);
    font-weight: bold;
    text-align: right;
  }

  .desc {
    color: var(--color-text-dim);
  }

  .enter {
    color: var(--color-danger);
    font-weight: bold;
    letter-spacing: 0.2rem;
    animation: blink 1.5s infinite;
    text-shadow: 0 0 10px var(--color-danger-dim);
  }

  .show {
    opacity: 1 !important;
  }

  @keyframes type {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @keyframes glitch {
    2%, 64% { transform: translate(2px, 0) skew(0deg); }
    4%, 60% { transform: translate(-2px, 0) skew(0deg); }
    62% { transform: translate(0, 0) skew(5deg); }
  }

  @keyframes glitch-anim {
    0% { clip: rect(14px, 9999px, 11px, 0); }
    20% { clip: rect(85px, 9999px, 140px, 0); }
    40% { clip: rect(66px, 9999px, 115px, 0); }
    60% { clip: rect(130px, 9999px, 13px, 0); }
    80% { clip: rect(16px, 9999px, 104px, 0); }
    100% { clip: rect(11px, 9999px, 80px, 0); }
  }

  @keyframes glitch-anim-2 {
    0% { clip: rect(65px, 9999px, 100px, 0); }
    20% { clip: rect(10px, 9999px, 40px, 0); }
    40% { clip: rect(115px, 9999px, 130px, 0); }
    60% { clip: rect(80px, 9999px, 15px, 0); }
    80% { clip: rect(40px, 9999px, 65px, 0); }
    100% { clip: rect(100px, 9999px, 115px, 0); }
  }
</style>
