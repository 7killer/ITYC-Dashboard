// Loading status for the Virtual Regatta game itself.  The parent page renders
// the status received from the game iframe, before the legacy dashboard is
// ready to provide its usual data row.
(() => {
  if (window.itycGameLoading) return;
  window.itycGameLoading = true;

  const statusId = 'itycGameLoadingStatus';
  const isGameFrame = /^(play\.offshore|beta)\.virtualregatta\.com$/.test(location.hostname);
  let latestText = '';
  let refreshTimer = null;

  function render(text) {
    const existing = document.getElementById(statusId);
    if (!text) {
      existing?.remove();
      return;
    }
    const row = document.getElementById('dashIntegRow');
    if (!row) return;
    const status = existing || document.createElement('div');
    status.id = statusId;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    if (status.textContent !== text) status.textContent = text;
    if (status.parentElement !== row) row.appendChild(status);
  }

  function refresh() {
    render(latestText);
    if (latestText || !refreshTimer) return;
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function setRenderedText(text) {
    latestText = text || '';
    refresh();
    if (latestText && !refreshTimer) refreshTimer = setInterval(refresh, 250);
  }

  if (!isGameFrame) {
    window.addEventListener('message', event => {
      if (!/^(https:\/\/play\.offshore|https:\/\/beta)\.virtualregatta\.com$/.test(event.origin)) return;
      if (event.data?.type !== 'ityc/gameLoading') return;
      setRenderedText(event.data.text);
    });
    return;
  }

  const state = {
    phase: 'page',
    binaries: [{ started: false, done: false }, { started: false, done: false }],
    unityProgress: null,
  };
  let lastPublishAt = 0;
  let lastText = null;

  function message() {
    if (state.phase === 'done') return '';
    if (state.phase === 'page') return '⏳ Chargement de la page du jeu…';
    if (state.phase === 'binary') {
      const progress = Number(state.unityProgress);
      if (Number.isFinite(progress) && progress > 0) {
        return `⏳ Téléchargement Unity — ≈${Math.min(99, Math.floor((progress / 0.9) * 100))}%`;
      }
      const names = state.binaries
        .map((binary, index) => binary.started && !binary.done ? (index === 0 ? 'données' : 'code') : null)
        .filter(Boolean);
      return names.length ? `⏳ Téléchargement Unity — ${names.join(' et ')}…` : '⏳ Téléchargement Unity…';
    }
    if (state.phase === 'account') return '⏳ Chargement des données de course…';
    return '⏳ Initialisation Unity…';
  }

  function publish(force = false) {
    const text = message();
    const now = Date.now();
    if (!force && text === lastText && now - lastPublishAt < 250) return;
    lastText = text;
    lastPublishAt = now;
    window.parent.postMessage({ type: 'ityc/gameLoading', text }, '*');
  }

  function setPhase(phase) {
    if (state.phase === phase) return;
    state.phase = phase;
    publish(true);
  }

  function markUnityBinariesReady() {
    for (const binary of state.binaries) {
      if (binary.started) binary.done = true;
    }
    setPhase('unity');
  }

  function observeUnityProgress(progress) {
    const value = Number(progress);
    if (!Number.isFinite(value)) return;
    state.unityProgress = Math.max(0, Math.min(1, value));
    if (value > 0) state.binaries[1].started = true;
    if (value >= 0.9) {
      for (const binary of state.binaries) {
        if (binary.started) binary.done = true;
      }
      setPhase('unity');
    } else {
      setPhase('binary');
      publish();
    }
  }

  function wrapUnityFactory(original) {
    if (typeof original !== 'function' || original.__itycGameLoadingWrapped) return original;
    const wrapped = function(canvas, config, onProgress, ...rest) {
      const callback = typeof onProgress === 'function' ? onProgress : null;
      const relay = progress => {
        observeUnityProgress(progress);
        return callback?.(progress);
      };
      return original.call(this, canvas, config, relay, ...rest);
    };
    Object.defineProperty(wrapped, '__itycGameLoadingWrapped', { value: true });
    return wrapped;
  }

  try {
    let factory = window.createUnityInstance;
    Object.defineProperty(window, 'createUnityInstance', {
      configurable: true,
      enumerable: true,
      get: () => factory,
      set: value => { factory = wrapUnityFactory(value); },
    });
    if (typeof factory === 'function') factory = wrapUnityFactory(factory);
  } catch { /* The fetch fallback below still reports the active Unity files. */ }

  const nativeFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const path = url ? new URL(url, location.href).pathname : '';
    const index = /\.data(?:\.gz|\.br)?$/i.test(path) ? 0 : /\.wasm(?:\.gz|\.br)?$/i.test(path) ? 1 : -1;
    if (index >= 0) {
      state.binaries[index].started = true;
      state.binaries[index].done = false;
      setPhase('binary');
    }
    if (/\/StreamingAssets\/build_info\.txt$/i.test(path)) markUnityBinariesReady();

    return nativeFetch.apply(this, arguments).then(response => {
      if (index >= 0 && (response.status === 304 || !response.ok)) {
        state.binaries[index].done = true;
        if (state.binaries.every(binary => !binary.started || binary.done)) setPhase('unity');
      }
      if (/\/getboatinfos$/i.test(path) && response.ok) setPhase('done');
      return response;
    }, error => {
      if (index >= 0) {
        state.binaries[index].done = true;
        if (state.binaries.every(binary => !binary.started || binary.done)) setPhase('unity');
      }
      throw error;
    });
  };

  publish(true);
  const readyTimer = setInterval(() => {
    if (state.phase === 'page' && document.getElementById('gameCanvas')) setPhase('unity');
    if (window.gameInstance && state.phase !== 'done') setPhase('account');
    if (state.phase === 'done') clearInterval(readyTimer);
  }, 100);
})();
