(() => {
  const byId = id => document.getElementById(id);
  const badge = byId('aiStatusBadge');
  const title = byId('aiConnectionTitle');
  const text = byId('aiConnectionText');
  const model = byId('aiModelName');
  const help = byId('aiHelpModal');

  function setStatus(mode, modelName = '—') {
    if (!badge) return;
    badge.classList.remove('checking', 'connected', 'demo', 'error');
    badge.classList.add(mode);
    const labels = {
      checking: 'AI checking',
      connected: 'AI connected',
      demo: 'Demo mode',
      error: 'AI unavailable'
    };
    badge.querySelector('span').textContent = labels[mode] || labels.error;
    if (model) model.textContent = modelName;
    if (title && text) {
      if (mode === 'connected') {
        title.textContent = 'Real AI server is connected';
        text.textContent = 'Food photos, menus, receipts, pantry images, ingredient labels and Coach chat can use the configured AI model.';
      } else if (mode === 'demo') {
        title.textContent = 'The app is running in demo mode';
        text.textContent = 'Tracking still works, but image analysis and Coach responses use built-in fallbacks until the secure AI server is started.';
      } else if (mode === 'error') {
        title.textContent = 'AI server could not be reached';
        text.textContent = 'Start the app using START-MAKANAI-WINDOWS.bat after completing AI setup.';
      }
    }
  }

  async function checkStatus() {
    setStatus('checking');
    try {
      const response = await fetch('/api/ai-status', { cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) throw new Error('Static mode');
      const data = await response.json();
      setStatus(data.configured ? 'connected' : 'demo', data.model || '—');
    } catch {
      setStatus('demo', 'Not connected');
    }
  }

  async function testAI() {
    const button = byId('testAiBtn');
    if (!button) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Testing…';
    try {
      const response = await fetch('/api/ai-test', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Test failed');
      setStatus('connected', data.model || '—');
      window.toast?.('Real AI connection successful');
      if (!window.toast) alert(data.reply || 'Real AI connection successful');
    } catch (error) {
      setStatus('error', 'Not connected');
      alert(`${error.message}\n\nRun SETUP-AI-WINDOWS.bat, then restart the app.`);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function openHelp() { help?.classList.remove('hidden'); }
  function closeHelp() { help?.classList.add('hidden'); }

  badge?.addEventListener('click', openHelp);
  byId('openAiHelpBtn')?.addEventListener('click', openHelp);
  byId('closeAiHelpBtn')?.addEventListener('click', closeHelp);
  byId('testAiBtn')?.addEventListener('click', testAI);
  help?.addEventListener('click', event => { if (event.target === help) closeHelp(); });

  checkStatus();
  window.setInterval(checkStatus, 60000);
})();
