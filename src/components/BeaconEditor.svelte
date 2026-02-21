<script lang="ts">
  interface Props {
    onPlace: (message: string, author: string) => void
    onCancel: () => void
  }

  let { onPlace, onCancel }: Props = $props()

  let message = $state('')
  let author = $state('')

  function handleSubmit() {
    if (message.trim().length === 0) return
    onPlace(message.trim(), author.trim())
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.repeat) return
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onCancel} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="editor" onclick={(e) => e.stopPropagation()} role="dialog">
    <div class="editor-header">
      <span class="title">BEACON_UPLINK_TERMINAL</span>
      <span class="status">ONLINE</span>
    </div>
    
    <div class="editor-body">
      <p class="desc">> INITIALIZING ECHO PROTOCOL...</p>
      <p class="desc">> WARNING: MESSAGE WILL DEGRADE OVER TIME.</p>

      <div class="input-group">
        <label for="message-input">INPUT_DATA:</label>
        <div class="textarea-wrapper">
          <textarea
            id="message-input"
            bind:value={message}
            maxlength={280}
            placeholder="ENTER MESSAGE..."
            rows={4}
            autofocus
          ></textarea>
          <div class="counter" class:warning={message.length > 250}>
            [{message.length.toString().padStart(3, '0')}/280]
          </div>
        </div>
      </div>

      <div class="input-group">
        <label for="author-input">AUTHOR_ID (OPTIONAL):</label>
        <div class="input-wrapper">
          <span class="prompt">></span>
          <input
            id="author-input"
            bind:value={author}
            maxlength={30}
            placeholder="ANONYMOUS"
          />
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="cancel" onclick={onCancel}>[ ABORT ]</button>
      <button class="submit" onclick={handleSubmit} disabled={message.trim().length === 0}>
        [ TRANSMIT (CTRL+ENTER) ]
      </button>
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

  .editor {
    background: rgba(5, 10, 15, 0.95);
    border: 1px solid var(--color-primary);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.1), inset 0 0 20px rgba(0, 240, 255, 0.05);
    width: 500px;
    max-width: 90vw;
    color: var(--color-text);
    font-family: var(--font-mono);
    position: relative;
  }

  .editor::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--color-primary);
    box-shadow: 0 0 10px var(--color-primary-glow);
  }

  .editor-header {
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
    animation: blink 2s infinite;
  }

  .editor-body {
    padding: 2rem 1.5rem;
  }

  .desc {
    font-size: 0.8rem;
    color: var(--color-text-dim);
    margin: 0 0 0.5rem 0;
  }

  .desc:nth-child(2) {
    color: var(--color-danger);
    margin-bottom: 2rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
    letter-spacing: 0.1em;
  }

  .textarea-wrapper, .input-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-primary-dim);
    transition: border-color 0.3s;
  }

  .textarea-wrapper:focus-within, .input-wrapper:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.1);
  }

  textarea, input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 1rem;
    padding: 1rem;
    box-sizing: border-box;
    outline: none;
    resize: none;
  }

  textarea::placeholder, input::placeholder {
    color: rgba(107, 138, 153, 0.3);
  }

  .input-wrapper {
    display: flex;
    align-items: center;
  }

  .prompt {
    color: var(--color-primary);
    padding-left: 1rem;
  }

  .counter {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    font-size: 0.7rem;
    color: var(--color-text-dim);
  }

  .counter.warning {
    color: var(--color-danger);
  }

  .actions {
    display: flex;
    justify-content: space-between;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid var(--color-primary-dim);
  }

  button {
    background: transparent;
    border: 1px solid transparent;
    color: var(--color-text-dim);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.1em;
  }

  button:hover:not(:disabled) {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: rgba(0, 240, 255, 0.1);
    text-shadow: 0 0 5px var(--color-primary-glow);
  }

  button.submit {
    color: var(--color-primary);
    border-color: var(--color-primary-dim);
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
