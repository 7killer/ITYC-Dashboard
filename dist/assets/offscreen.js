import "./modulepreload-polyfill-7faf532e.js";
const workerUrl = "" + new URL("calc-62e8466b.js", import.meta.url).href;
const worker = new Worker(workerUrl, { type: "module" });
const channel = new MessageChannel();
const portToWorker = channel.port1;
const portLocal = channel.port2;
worker.postMessage({ type: "initPort" }, [portToWorker]);
chrome.runtime.onMessage.addListener(async (msg) => {
  if ((msg == null ? void 0 : msg.target) !== "offscreen")
    return;
  if (msg.type !== "job:start")
    return;
  const { id, descriptor } = msg;
  try {
    let buffer;
    if (descriptor.source === "fetch") {
      const resp = await fetch(descriptor.url);
      const ab = await resp.arrayBuffer();
      buffer = ab;
    } else if (descriptor.source === "idb") {
      buffer = await readLargeBufferFromIndexedDB(descriptor.key);
    } else if (descriptor.source === "compose") {
      buffer = descriptor.buffer;
    }
    portLocal.postMessage(
      { id, op: descriptor.op, payload: buffer },
      [buffer]
      // 👈 transfert
    );
    const summary = await waitWorkerResult(portLocal, id);
    chrome.runtime.sendMessage({ target: "bg", type: "job:done", id, summary });
  } catch (err) {
    chrome.runtime.sendMessage({ target: "bg", type: "job:error", id, error: String((err == null ? void 0 : err.message) || err) });
  }
});
function waitWorkerResult(port, id) {
  return new Promise((resolve, reject) => {
    const onMsg = (evt) => {
      const m = evt.data;
      if (!m || m.id !== id)
        return;
      if (m.type === "result") {
        port.removeEventListener("message", onMsg);
        resolve(m.summary);
      } else if (m.type === "error") {
        port.removeEventListener("message", onMsg);
        reject(new Error(m.error || "worker error"));
      }
    };
    port.addEventListener("message", onMsg);
    port.start();
  });
}
async function readLargeBufferFromIndexedDB(key) {
  const db = await openDB("VRDashboardDB", 1);
  return new Promise((resolve, reject) => {
    const tx = db.transaction("largeBlobs", "readonly");
    const store = tx.objectStore("largeBlobs");
    const req = store.get(key);
    req.onsuccess = () => {
      var _a;
      return resolve((_a = req.result) == null ? void 0 : _a.buffer);
    };
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
//# sourceMappingURL=offscreen.js.map
