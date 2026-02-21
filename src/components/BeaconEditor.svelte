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
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onCancel} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="editor" onclick={(e) => e.stopPropagation()} role="dialog">
    <h2>放置回声信标</h2>
    <p class="desc">你的消息将逐渐被时间吞噬</p>

    <label>
      <span>消息</span>
      <textarea
        bind:value={message}
        maxlength={280}
        placeholder="在此刻留下一句话..."
        rows={3}
      ></textarea>
      <span class="counter">{message.length}/280</span>
    </label>

    <label>
      <span>署名 (可选)</span>
      <input
        bind:value={author}
        maxlength={30}
        placeholder="匿名"
      />
    </label>

    <div class="actions">
      <button class="cancel" onclick={onCancel}>取消</button>
      <button class="submit" onclick={handleSubmit} disabled={message.trim().length === 0}>
        封存 (Ctrl+Enter)
      </button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .editor {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(100, 150, 220, 0.2);
    border-radius: 8px;
    padding: 2rem;
    width: 400px;
    max-width: 90vw;
    color: #aabbdd;
    font-family: 'Courier New', monospace;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 400;
    margin-bottom: 0.3rem;
    color: #ccddff;
  }

  .desc {
    font-size: 0.75rem;
    opacity: 0.5;
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 1rem;
  }

  label span {
    display: block;
    font-size: 0.75rem;
    opacity: 0.6;
    margin-bottom: 0.3rem;
  }

  textarea, input {
    width: 100%;
    background: rgba(20, 20, 35, 0.8);
    border: 1px solid rgba(100, 150, 220, 0.15);
    border-radius: 4px;
    color: #ccddff;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    padding: 0.6rem;
    resize: none;
  }

  textarea:focus, input:focus {
    outline: none;
    border-color: rgba(100, 150, 220, 0.4);
  }

  .counter {
    text-align: right;
    display: block;
    font-size: 0.65rem;
    opacity: 0.4;
    margin-top: 0.2rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  button {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    padding: 0.5rem 1.2rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid rgba(100, 150, 220, 0.3);
    transition: all 0.2s;
  }

  .cancel {
    background: transparent;
    color: #8899bb;
  }

  .submit {
    background: rgba(60, 100, 180, 0.3);
    color: #aaccff;
  }

  .submit:hover:not(:disabled) {
    background: rgba(60, 100, 180, 0.5);
  }

  .submit:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
