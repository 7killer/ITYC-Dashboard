// Activity indicator for the GRIB files downloaded by Virtual Regatta itself.
// It observes Unity's existing stream reader and never clones or buffers data.
(() => {
  if (window.itycGameGribLoading) return;
  window.itycGameGribLoading = true;

  const active = new Map();
  const statusId = 'itycGameGribLoadingStatus';
  let refreshTimer = null;

  function parseGrib(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url, location.href);
      if (parsed.hostname !== 'static.virtualregatta.com') return null;
      const match = parsed.pathname.match(/^\/winds\/fine\/\d{8}\/(\d{8})\.(\d{2})\.(\d{3})\.grb$/i);
      if (!match) return null;
      return {
        key: parsed.href,
        runDate: match[1],
        runCycle: match[2],
        fh: Number(match[3]),
      };
    } catch {
      return null;
    }
  }

  function currentGrib() {
    const downloads = Array.from(active.values());
    return downloads.length ? downloads[downloads.length - 1] : null;
  }

  function formatGrib(grib) {
    const date = String(grib.runDate || '');
    const dateLabel = /^\d{8}$/.test(date) ? `${date.slice(6, 8)}/${date.slice(4, 6)}` : '—';
    return `⏳ GRIB — run ${dateLabel} ${String(grib.runCycle || '').padStart(2, '0')}Z, H+${String(grib.fh).padStart(3, '0')}`;
  }

  function render() {
    const grib = currentGrib();
    const existing = document.getElementById(statusId);
    if (!grib) {
      existing?.remove();
      return;
    }
    const toolbar = document.getElementById('dashIntegRow');
    if (!toolbar) return;
    const status = existing || document.createElement('div');
    status.id = statusId;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const text = formatGrib(grib);
    if (status.textContent !== text) status.textContent = text;
    if (status.parentElement !== toolbar) toolbar.appendChild(status);
  }

  function refresh() {
    render();
    if (active.size || !refreshTimer) return;
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function startRefreshing() {
    refresh();
    if (!refreshTimer) refreshTimer = setInterval(refresh, 250);
  }

  function finish(grib) {
    if (!active.delete(grib.key)) return;
    refresh();
  }

  function observeBody(response, grib) {
    const body = response.body;
    if (!body || typeof body.getReader !== 'function') {
      finish(grib);
      return response;
    }
    const nativeGetReader = body.getReader;
    try {
      Object.defineProperty(body, 'getReader', {
        configurable: true,
        value(...args) {
          const reader = nativeGetReader.apply(body, args);
          let completed = false;
          const complete = () => {
            if (completed) return;
            completed = true;
            finish(grib);
          };
          reader.closed.then(complete, complete);
          return new Proxy(reader, {
            get(target, property) {
              if (property === 'read') {
                return async (...readArgs) => {
                  try {
                    const result = await target.read(...readArgs);
                    if (result.done) complete();
                    return result;
                  } catch (error) {
                    complete();
                    throw error;
                  }
                };
              }
              const value = Reflect.get(target, property, target);
              return typeof value === 'function' ? value.bind(target) : value;
            },
          });
        },
      });
    } catch {
      finish(grib);
    }
    return response;
  }

  const nativeFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    const grib = method === 'GET' ? parseGrib(url) : null;
    if (!grib) return nativeFetch.apply(this, arguments);

    active.set(grib.key, grib);
    startRefreshing();
    return nativeFetch.apply(this, arguments).then((response) => {
      if (!response.ok || response.status === 304) {
        finish(grib);
        return response;
      }
      return observeBody(response, grib);
    }, error => {
      finish(grib);
      throw error;
    });
  };

})();
