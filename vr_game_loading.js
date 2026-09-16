// Loading status for the Virtual Regatta game itself.  The parent page renders
// the status received from the game iframe, before the legacy dashboard is
// ready to provide its usual data row.
(() => {
  if (window.itycGameLoading) return;
  window.itycGameLoading = true;

  const statusId = 'itycGameLoadingStatus';
  const isGameFrame = /^(play\.offshore|beta)\.virtualregatta\.com$/.test(location.hostname);
  let latestText = '';

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

  function setRenderedText(text) {
    latestText = text || '';
    render(latestText);
  }

  if (!isGameFrame) {
    window.addEventListener('message', event => {
      if (!/^(https:\/\/play\.offshore|https:\/\/beta)\.virtualregatta\.com$/.test(event.origin)) return;
      if (event.data?.type !== 'ityc/gameLoading') return;
      setRenderedText(event.data.text);
    });
    // The legacy listener rebuilds dashIntegRow as the game changes state.
    // Reattach only after such a rebuild; a periodic reinsertion causes a
    // visible flicker on the welcome screen.
    new MutationObserver(() => {
      if (!latestText) return;
      const row = document.getElementById('dashIntegRow');
      const status = document.getElementById(statusId);
      if (row && status?.parentElement !== row) render(latestText);
    }).observe(document.documentElement, { childList: true, subtree: true });
    return;
  }

  const state = {
    phase: 'page',
    binaries: [
      { started: false, done: false, loaded: 0, total: null, progress: 0 },
      { started: false, done: false, loaded: 0, total: null, progress: 0 },
    ],
    unityProgress: null,
  };
  let lastPublishAt = 0;
  let lastText = null;

  function message() {
    if (state.phase === 'done') return '';
    if (state.phase === 'page') return '⏳ Chargement de la page du jeu…';
    if (state.phase === 'binary') {
      const files = state.binaries
        .map((binary, index) => ({ binary, index }))
        .filter(({ binary }) => binary.started || binary.done || binary.cached)
        .map(({ binary, index }) => {
          let progress = binary.done ? '100%' : Number.isFinite(Number(binary.progress))
            ? `${Math.min(99, Math.floor(100 * binary.progress))}%`
            : 'téléchargement…';
          if (binary.cached) progress = 'en cache';
          else if (!binary.done && binary.error) progress = 'échec';
          return `${index === 0 ? 'Jeu' : 'Loader'} ${progress}`;
        });
      if (files.length) return `⏳ Téléchargement Unity — ${files.join(' · ')}`;
      const progress = Number(state.unityProgress);
      if (Number.isFinite(progress) && progress > 0) {
        return `⏳ Téléchargement Unity — ≈${Math.min(99, Math.floor((progress / 0.9) * 100))}%`;
      }
      const names = state.binaries
        .map((binary, index) => binary.started ? (index === 0 ? 'Jeu' : 'Loader') : null)
        .filter(Boolean);
      return names.length ? `⏳ Téléchargement Unity — ${names.join(' et ')}…` : '⏳ Téléchargement Unity…';
    }
    if (state.phase === 'course') return '⏳ Chargement des données de course…';
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
      if (binary.started) {
        binary.done = true;
        binary.progress = 1;
      }
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
        if (binary.started) {
          binary.done = true;
          binary.progress = 1;
        }
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

  // Measured decoded sizes. Unity exposes decompressed chunks, so use these
  // fixed file sizes when the response does not expose a usable size.
  const referenceSizes = {
    '/unity/vro/Game/20260828-1129c/Build/VRO2K16 WebGL GS.data.gz': [168277591, 204106390],
    '/unity/vro/Game/20260828-1129c/Build/VRO2K16 WebGL GS.wasm.gz': [14840175, 59695496],
  };

  function decodedSize(url, response) {
    const encoded = Number(response.headers.get('content-length'));
    const path = decodeURIComponent(new URL(url, location.href).pathname);
    const captured = referenceSizes[path];
    const measured = captured?.[1]
      || (/\.data(?:\.gz|\.br)?$/i.test(path) ? 204106390 : /\.wasm(?:\.gz|\.br)?$/i.test(path) ? 59695496 : null);
    if (!response.headers.get('content-encoding')) return encoded > 0 ? encoded : measured;
    return captured?.[0] === encoded ? captured[1] : measured;
  }

  async function observeBody(response, binary) {
    if (!response.body) return;
    try {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        binary.loaded += value?.byteLength || 0;
        const total = Number(binary.total);
        if (total > 0) binary.progress = Math.max(binary.progress || 0, Math.min(0.99, binary.loaded / total));
        publish();
      }
      binary.done = true;
      binary.progress = 1;
      if (!binary.total && binary.loaded > 0) binary.total = binary.loaded;
      if (state.binaries.every(item => !item.started || item.done) && state.phase === 'binary') setPhase('unity');
      else publish(true);
    } catch {
      // Unity's original response is untouched; failure of the observer must
      // not turn a successful game download into an error.
    }
  }

  const nativeFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const path = url ? new URL(url, location.href).pathname : '';
    const index = /\.data(?:\.gz|\.br)?$/i.test(path) ? 0 : /\.wasm(?:\.gz|\.br)?$/i.test(path) ? 1 : -1;
    if (index >= 0) {
      const binary = state.binaries[index];
      binary.loaded = 0;
      binary.total = null;
      binary.progress = 0;
      binary.started = true;
      binary.done = false;
      delete binary.error;
      delete binary.cached;
      setPhase('binary');
    }
    if (/\/StreamingAssets\/build_info\.txt$/i.test(path)) markUnityBinariesReady();
    if (/\/getboatinfos$/i.test(path)) setPhase('course');

    return nativeFetch.apply(this, arguments).then(response => {
      if (index >= 0) {
        const binary = state.binaries[index];
        if (response.status === 304) {
          binary.cached = true;
          binary.done = true;
          binary.progress = 1;
          if (state.binaries.every(item => !item.started || item.done)) setPhase('unity');
        } else if (!response.ok) {
          binary.error = true;
          publish(true);
        } else if (response.body) {
          binary.total = decodedSize(url, response);
          try { void observeBody(response.clone(), binary); } catch { /* Unity remains authoritative. */ }
        }
      }
      if (/\/getboatinfos$/i.test(path) && response.ok) setPhase('done');
      return response;
    }, error => {
      if (index >= 0) {
        state.binaries[index].error = true;
        publish(true);
      }
      throw error;
    });
  };

  publish(true);
  const readyTimer = setInterval(() => {
    if (state.phase === 'page' && document.getElementById('gameCanvas')) setPhase('unity');
    if (state.phase === 'done') clearInterval(readyTimer);
  }, 100);
})();
