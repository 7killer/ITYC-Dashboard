import workerUrl from '../workers/calc.js?worker&url';

// 1) Crée le worker et un canal dédié
const worker = new Worker(workerUrl, { type: 'module' });
const channel = new MessageChannel();
const portToWorker = channel.port1; // ira au worker
const portLocal   = channel.port2; // gardé côté offscreen

// Transfert du port au worker (zéro-copie)
worker.postMessage({ type: 'initPort' }, [portToWorker]);

// 2) Orchestration: reçoit l’ordre du SW (léger), récupère les gros buffers localement
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg?.target !== 'offscreen') return;
  if (msg.type !== 'job:start') return;

  const { id, descriptor } = msg;

  try {
    let buffer; // ArrayBuffer volumineux

    if (descriptor.source === 'fetch') {
      const resp = await fetch(descriptor.url);
      const ab   = await resp.arrayBuffer();
      buffer = ab; // gros buffer récupéré localement (pas passé via SW)
    } else if (descriptor.source === 'idb') {
      // Exemple: lecture depuis IndexedDB (zéro message au SW)
      buffer = await readLargeBufferFromIndexedDB(descriptor.key);
    } else if (descriptor.source === 'compose') {
      buffer = descriptor.buffer; // ⚠️ si tu fournis buffer depuis SW => clonage (éviter)
    }

    // 3) Envoi au worker avec TRANSFER LIST (zéro-copie offscreen->worker)
    portLocal.postMessage(
      { id, op: descriptor.op, payload: buffer },
      [buffer] // 👈 transfert
    );

    // 4) Attends le résultat du worker (petit récap ou autre clé IDB)
    const summary = await waitWorkerResult(portLocal, id);

    // 5) Notifie le SW (léger). Optionnel: écris le gros résultat en IDB avant.
    chrome.runtime.sendMessage({ target: 'bg', type: 'job:done', id, summary });
  } catch (err) {
    chrome.runtime.sendMessage({ target: 'bg', type: 'job:error', id, error: String(err?.message || err) });
  }
});

// Helpers --------------------------

function waitWorkerResult(port, id) {
  return new Promise((resolve, reject) => {
    const onMsg = (evt) => {
      const m = evt.data;
      if (!m || m.id !== id) return;
      if (m.type === 'result') {
        port.removeEventListener('message', onMsg);
        resolve(m.summary);
      } else if (m.type === 'error') {
        port.removeEventListener('message', onMsg);
        reject(new Error(m.error || 'worker error'));
      }
    };
    port.addEventListener('message', onMsg);
    port.start();
  });
}

async function readLargeBufferFromIndexedDB(key) {
  // exemple rapide (à adapter à ta DB)
  const db = await openDB('VRDashboardDB', 1);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('largeBlobs', 'readonly');
    const store = tx.objectStore('largeBlobs');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.buffer);
    req.onerror = () => reject(req.error);
  });
}

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
