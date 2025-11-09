(function() {
  "use strict";
  let port;
  self.onmessage = (e) => {
    const { data, ports } = e;
    if ((data == null ? void 0 : data.type) === "initPort" && ports && ports[0]) {
      port = ports[0];
      port.onmessage = onPortMessage;
      port.start();
    }
  };
  function onPortMessage(evt) {
    const { id, op, payload } = evt.data || {};
    try {
      if (!(payload instanceof ArrayBuffer)) {
        throw new Error("payload must be ArrayBuffer");
      }
      const view = new Uint8Array(payload);
      let sum = 0;
      for (let i = 0; i < view.length; i++) {
        sum = sum + view[i] % 10 >>> 0;
      }
      port.postMessage({ type: "result", id, summary: { op, bytes: view.length, sum } });
    } catch (err) {
      port.postMessage({ type: "error", id, error: String((err == null ? void 0 : err.message) || err) });
    }
  }
})();
//# sourceMappingURL=calc-62e8466b.js.map
