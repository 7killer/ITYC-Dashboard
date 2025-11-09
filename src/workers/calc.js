let port; // MessagePort dédié

self.onmessage = (e) => {
  const { data, ports } = e;
  if (data?.type === 'initPort' && ports && ports[0]) {
    port = ports[0];
    port.onmessage = onPortMessage;
    port.start();
  }
};

function onPortMessage(evt) {
  const { id, op, payload } = evt.data || {};

  try {
    if (!(payload instanceof ArrayBuffer)) {
      throw new Error('payload must be ArrayBuffer');
    }

    // Exemple de “gros” calcul
    const view = new Uint8Array(payload);
    let sum = 0;
    for (let i = 0; i < view.length; i++) {
      sum = (sum + (view[i] % 10)) >>> 0;
    }

    // Résumé renvoyé (léger). Le payload d’origine a été TRANSFÉRÉ (perdu côté offscreen).
    port.postMessage({ type: 'result', id, summary: { op, bytes: view.length, sum } });
  } catch (err) {
    port.postMessage({ type: 'error', id, error: String(err?.message || err) });
  }
}
