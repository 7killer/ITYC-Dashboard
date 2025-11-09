const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
let idbProxyableTypes;
let cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const cursorRequestMap = /* @__PURE__ */ new WeakMap();
const transactionDoneMap = /* @__PURE__ */ new WeakMap();
const transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
const transformCache = /* @__PURE__ */ new WeakMap();
const reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
const readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
const writeMethods = ["put", "add", "delete", "clear"];
const cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));
const paramStamina = {
  "recovery": {
    "points": 1,
    "loWind": 0,
    "hiWind": 30,
    "loTime": 5,
    "hiTime": 15
  },
  "tiredness": [20, 50],
  "consumption": {
    "points": {
      "tack": 10,
      "gybe": 10,
      "sail": 20
    },
    "winds": {
      "0": 1,
      "10": 1.2,
      "20": 1.5,
      "30": 2
    },
    "boats": {
      "0": 1,
      "5": 1.2,
      "15": 1.5,
      "50": 2
    }
  },
  "impact": {
    "0": 2,
    "100": 0.5
  }
};
const debugDB = false;
const debugDBErr = true;
const debugDBIte = false;
const debugDBIteErr = true;
const debugIngester = false;
const debugIngesterErr = true;
const debugIteRun = true;
const debugIteRunErr = true;
const debugFilter1 = true;
const cfg = {
  debugDB,
  debugDBErr,
  debugDBIte,
  debugDBIteErr,
  debugIngester,
  debugIngesterErr,
  debugIteRun,
  debugIteRunErr,
  debugFilter1
};
const DB_NAME = "VRDashboardDB3";
const DB_VERSION = 5;
async function openDatabase() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("internal")) {
          const store = db.createObjectStore("internal", { keyPath: "id" });
          if (cfg.debugDB)
            ;
          store.add({
            //                      key: "paramStamina",
            id: "paramStamina",
            paramStamina
          });
          store.add({
            id: "lastLoggedUser",
            loggedUser: null
          });
          store.add({
            id: "lastOpennedRace",
            raceId: null,
            legNum: null,
            lastOpennedRace: null
          });
          store.add({
            id: "playersUpdate",
            ts: Date.now()
          });
          store.add({
            id: "teamsUpdate",
            ts: Date.now()
          });
          store.add({
            id: "polarsUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legListUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legFleetInfosUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legPlayersInfosUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legFleetInfosDashUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legPlayersInfosDashUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legPlayersOptionsUpdate",
            ts: Date.now()
          });
          store.add({
            id: "legPlayersOrderUpdate",
            ts: Date.now()
          });
          store.add({
            id: "state",
            state: "dashInstalled"
          });
        }
        if (!db.objectStoreNames.contains("players")) {
          db.createObjectStore("players", { keyPath: "id" });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("teams")) {
          db.createObjectStore("teams", { keyPath: "id" });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("polars")) {
          db.createObjectStore("polars", { keyPath: "id" });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("legList")) {
          const store = db.createObjectStore("legList", {
            keyPath: ["raceId", "legNum"]
          });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("legFleetInfos")) {
          const store = db.createObjectStore("legFleetInfos", {
            keyPath: ["raceId", "legNum", "userId", "iteDate"]
          });
          store.createIndex("byTriplet", ["raceId", "legNum", "userId"], { unique: false });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("legPlayersInfos")) {
          const store = db.createObjectStore("legPlayersInfos", {
            keyPath: ["raceId", "legNum", "userId", "iteDate"]
          });
          store.createIndex("byTriplet", ["raceId", "legNum", "userId"], { unique: false });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("legPlayersOrder")) {
          const store = db.createObjectStore("legPlayersOrder", {
            keyPath: ["raceId", "legNum", "userId", "iteDate"]
          });
          store.createIndex("byTriplet", ["raceId", "legNum", "userId"], { unique: false });
          if (cfg.debugDB)
            ;
        }
        if (!db.objectStoreNames.contains("legPlayersOptions")) {
          const store = db.createObjectStore("legPlayersOptions", {
            keyPath: ["raceId", "legNum", "userId"]
          });
          store.createIndex("byTriplet", ["raceId", "legNum", "userId"], { unique: false });
          store.createIndex("byRaceLeg", ["raceId", "legNum"], { unique: false });
          if (cfg.debugDB)
            ;
        }
      }
    });
  } catch (error) {
    console.error("Error opening database:", error);
    throw error;
  }
}
async function getData(storeName, key) {
  try {
    if (key === void 0 || key === null) {
      throw new Error(
        `put error: missing 'key' parameter for store ${storeName}`
      );
    }
    const db = await openDatabase();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await store.get(key);
    await tx.done;
    db.close();
    if (result === void 0) {
      if (cfg.debugDB)
        ;
    } else {
      if (cfg.debugDB)
        ;
    }
    return result;
  } catch (error) {
    console.error(`Error getting data from ${storeName}:`, error);
    throw error;
  }
}
async function getAllData(storeName) {
  let db;
  try {
    db = await openDatabase();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await store.getAll();
    await tx.done;
    if (cfg.debugDB)
      ;
    return result;
  } catch (error) {
    console.error(`Error getting all data from ${storeName}:`, error);
    throw error;
  } finally {
    try {
      db == null ? void 0 : db.close();
    } catch {
    }
  }
}
async function saveData(storeName, data, key, options = {}) {
  const { updateIfExists = false } = options;
  try {
    const db = await openDatabase();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const hasInlineKey = !!store.keyPath;
    const resolveInlineKey = () => {
      const kp = store.keyPath;
      if (!kp)
        return void 0;
      if (typeof kp === "string") {
        const v = data == null ? void 0 : data[kp];
        if (v === void 0 || v === null) {
          throw new Error(`saveData: store "${storeName}" utilise keyPath="${kp}" mais data.${kp} est manquant`);
        }
        return v;
      }
      if (Array.isArray(kp)) {
        const arr = kp.map((k) => {
          const v = data == null ? void 0 : data[k];
          if (v === void 0 || v === null) {
            throw new Error(`saveData: store "${storeName}" keyPath composé ${JSON.stringify(kp)} → data.${k} manquant`);
          }
          return v;
        });
        return arr;
      }
      throw new Error(`saveData: keyPath non supporté pour le store "${storeName}"`);
    };
    if (hasInlineKey) {
      if (key !== void 0) {
        if (cfg.debugDB)
          ;
      }
      const recordKey = resolveInlineKey();
      if (updateIfExists) {
        const existing = await store.get(recordKey);
        if (existing) {
          await store.put({ ...existing, ...data });
          if (cfg.debugDB)
            ;
        } else {
          await store.put(data);
          if (cfg.debugDB)
            ;
        }
      } else {
        await store.put(data);
        if (cfg.debugDB)
          ;
      }
    } else {
      const needsKey = !store.autoIncrement && (key === void 0 || key === null);
      if (needsKey) {
        throw new Error(`saveData: store "${storeName}" sans keyPath et sans autoIncrement → "key" requis`);
      }
      if (updateIfExists) {
        const existing = key !== void 0 && key !== null ? await store.get(key) : null;
        if (existing) {
          key !== void 0 && key !== null ? await store.put({ ...existing, ...data }, key) : await store.put({ ...existing, ...data });
          if (cfg.debugDB)
            ;
        } else {
          key !== void 0 && key !== null ? await store.put(data, key) : await store.put(data);
          if (cfg.debugDB)
            ;
        }
      } else {
        key !== void 0 && key !== null ? await store.put(data, key) : await store.put(data);
        if (cfg.debugDB)
          ;
      }
    }
    await tx.done;
    db.close();
  } catch (error) {
    console.error(`❌ Error saving data to ${storeName}:`, error);
    throw error;
  }
}
function handleIndexedDBError(error, context = "IndexedDB Operation") {
  console.error("Error Name:", error.name);
  console.error("Error Message:", error.message);
  switch (error.name) {
  }
}
function processDBOperations(dbOperations) {
  dbOperations.forEach((operation) => {
    const { type, ...stores } = operation;
    Object.entries(stores).forEach(([storeName, records]) => {
      if (Array.isArray(records)) {
        records.forEach((record) => {
          executeDBOperation(type, storeName, record);
        });
      }
    });
  });
}
async function executeDBOperation(operation, storeName, data, callback = null) {
  try {
    switch (operation) {
      case "put":
        await saveData(storeName, data, data.key);
        break;
      case "get":
        const result = await getData(storeName, $data.key);
        if (callback)
          callback(result);
        return result;
      case "putOrUpdate":
        await saveData(storeName, data, data.key, { updateIfExists: true });
        break;
      default:
        if (cfg.debugDBErr)
          console.error("Opération non reconnue :", operation);
        throw new Error(`Opération non reconnue : ${operation}`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'opération ${operation} sur ${storeName}:`, error);
    handleIndexedDBError(error, `DB Operation: ${operation}`);
    if (callback && typeof callback === "function") {
      callback(null, error);
    }
    throw error;
  }
}
function createKeyChangeListener(storeName, key, options = {}) {
  const {
    timeout = 500,
    maxAttempts = 0
  } = options;
  const listener = {
    db: null,
    initialValue: null,
    attempts: 0,
    intervalId: null,
    isRunning: false,
    onChangeCallback: null,
    async readCurrentValue() {
      if (!this.db)
        return;
      try {
        const tx = this.db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const currentValue = await store.get(key);
        if (JSON.stringify(currentValue) !== JSON.stringify(this.initialValue)) {
          const payload = {
            newValue: currentValue,
            oldValue: this.initialValue
          };
          console.log("🔁 Changement détecté :", payload);
          if (typeof this.onChangeCallback === "function") {
            this.onChangeCallback(payload);
          }
          this.initialValue = currentValue;
        }
        await tx.done;
      } catch (err) {
        console.error("💥 Erreur lors de la lecture dans readCurrentValue :", err);
      }
    },
    async start({ referenceValue = null, onChange = null } = {}) {
      if (this.isRunning)
        return;
      try {
        this.db = await openDatabase();
        this.onChangeCallback = onChange || null;
        const tx = this.db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const currentValue = await store.get(key);
        await tx.done;
        if (referenceValue !== null) {
          const isDifferent = JSON.stringify(currentValue) !== JSON.stringify(referenceValue);
          if (isDifferent && typeof this.onChangeCallback === "function") {
            this.onChangeCallback({
              oldValue: referenceValue,
              newValue: currentValue
            });
          }
        }
        this.initialValue = currentValue;
        this.isRunning = true;
        this.attempts = 0;
        this.intervalId = setInterval(() => {
          this.attempts++;
          this.readCurrentValue();
          if (this.attempts >= maxAttempts && maxAttempts !== 0) {
            this.stop();
            console.warn("⏱️ Timeout atteint sans changement.");
          }
        }, timeout);
      } catch (error) {
        this.stop();
        console.error("💥 Erreur lors du démarrage :", error);
      }
    },
    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      this.isRunning = false;
      this.attempts = 0;
      this.onChangeCallback = null;
    },
    interrupt() {
      this.stop();
    }
  };
  return listener;
}
async function getLatestEntriesPerUser(raceId, legNum, {
  timeout = 5e3,
  since = Date.now() - 10 * 60 * 1e3,
  until = Number.MAX_SAFE_INTEGER,
  maxUsers = 0,
  storeName = "legPlayersInfos"
} = {}) {
  const r = Number(raceId);
  const l = Number(legNum);
  if (!Number.isFinite(r) || !Number.isFinite(l)) {
    console.error("[getLatestEntriesPerUser] Invalid arguments", { raceId, legNum });
    return { items: null, meta: { usersScanned: 0, usersTaken: 0, timedOut: false, reason: "invalid-args", elapsedMs: 0, since, until } };
  }
  let db, tx;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const job = (async () => {
    var _a, _b;
    db = await openDatabase();
    tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    if (!store.indexNames.contains("byTriplet")) {
      throw new Error(`[getLatestEntriesPerUser] Missing index 'byTriplet' on ${storeName}`);
    }
    const byTriplet = store.index("byTriplet");
    const userRange = IDBKeyRange.bound([r, l, ""], [r, l, "￿"]);
    const mapByUser = /* @__PURE__ */ Object.create(null);
    let usersScanned = 0;
    let reason = "done";
    let uCursor = await byTriplet.openKeyCursor(userRange, "nextunique");
    while (uCursor) {
      usersScanned++;
      const u = (_a = uCursor.key) == null ? void 0 : _a[2];
      const lower = [r, l, u, Math.max(0, Number(since) || 0)];
      const upper = [r, l, u, Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)];
      const range = IDBKeyRange.bound(lower, upper);
      let sCursor = await store.openCursor(range, "prev");
      if (sCursor) {
        mapByUser[u] = sCursor.value;
      }
      if (maxUsers && Object.keys(mapByUser).length >= maxUsers) {
        reason = "max-users-reached";
        break;
      }
      uCursor = await uCursor.continue();
    }
    await tx.done;
    (_b = db.close) == null ? void 0 : _b.call(db);
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const meta = {
      usersScanned,
      usersTaken: Object.keys(mapByUser).length,
      timedOut: false,
      reason,
      elapsedMs: Math.max(0, t1 - t0),
      since: Math.max(0, Number(since) || 0),
      until: Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)
    };
    return { items: mapByUser, meta };
  })();
  try {
    return await withTimeout(job, timeout, () => {
      var _a, _b;
      try {
        (_a = tx == null ? void 0 : tx.abort) == null ? void 0 : _a.call(tx);
      } catch {
      }
      try {
        (_b = db == null ? void 0 : db.close) == null ? void 0 : _b.call(db);
      } catch {
      }
    });
  } catch (err) {
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (String((err == null ? void 0 : err.message) || "").includes("Timeout")) {
      const meta2 = { usersScanned: 0, usersTaken: 0, timedOut: true, reason: "timeout", elapsedMs: Math.max(0, t1 - t0), since, until };
      return { items: null, meta: meta2 };
    }
    const meta = { usersScanned: 0, usersTaken: 0, timedOut: false, reason: "error", elapsedMs: Math.max(0, t1 - t0), since, until };
    console.error("[getLatestEntriesPerUser] error:", err, { leg: [r, l], meta });
    return { items: null, meta };
  }
}
function withTimeout(promise, ms, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        onTimeout == null ? void 0 : onTimeout();
      } catch (_) {
      }
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}
async function getEntriesForTriplet(raceId, legNum, userId, {
  limit = 0,
  timeout = 5e3,
  since = Date.now() - 10 * 60 * 1e3,
  // 👉 dernière 10 minutes par défaut
  until = Number.MAX_SAFE_INTEGER,
  // 👉 pas de plafond par défaut
  storeName = "legPlayersInfos"
} = {}) {
  const r = Number(raceId);
  const l = Number(legNum);
  const u = String(userId ?? "").trim();
  if (!Number.isFinite(r) || !Number.isFinite(l) || !u) {
    const msg = "[getEntriesForTriplet] Invalid arguments";
    console.error(msg, { raceId, legNum, userId });
    return { items: null, meta: { scanned: 0, taken: 0, timedOut: false, reason: "invalid-args", elapsedMs: 0, since, until } };
  }
  let db, tx;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const job = (async () => {
    var _a, _b;
    db = await openDatabase();
    tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const lower = [r, l, u, Math.max(0, Number(since) || 0)];
    const upper = [r, l, u, Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)];
    const range = IDBKeyRange.bound(lower, upper);
    const results = [];
    let scanned = 0;
    let reason = "done";
    let cursor = await store.openCursor(range, "prev");
    while (cursor) {
      scanned++;
      const value = cursor.value;
      const iteDate = (value == null ? void 0 : value.iteDate) ?? ((_a = cursor.key) == null ? void 0 : _a[3]);
      if (iteDate < lower[3]) {
        reason = "stopped-too-old";
        break;
      }
      results.push(value);
      if (limit && results.length >= limit) {
        reason = "limit-reached";
        break;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    (_b = db.close) == null ? void 0 : _b.call(db);
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const meta = {
      scanned,
      taken: results.length,
      timedOut: false,
      reason,
      elapsedMs: Math.max(0, t1 - t0),
      since: lower[3],
      until: upper[3]
    };
    return { items: results, meta };
  })();
  try {
    return await withTimeout(job, timeout, () => {
      var _a, _b;
      try {
        (_a = tx == null ? void 0 : tx.abort) == null ? void 0 : _a.call(tx);
      } catch (_) {
      }
      try {
        (_b = db == null ? void 0 : db.close) == null ? void 0 : _b.call(db);
      } catch (_) {
      }
    });
  } catch (err) {
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (String((err == null ? void 0 : err.message) || "").includes("Timeout")) {
      const meta2 = {
        scanned: 0,
        taken: 0,
        timedOut: true,
        reason: "timeout",
        elapsedMs: Math.max(0, t1 - t0),
        since,
        until
      };
      return { items: null, meta: meta2 };
    }
    const meta = {
      scanned: 0,
      taken: 0,
      timedOut: false,
      reason: "error",
      elapsedMs: Math.max(0, t1 - t0),
      since,
      until
    };
    console.error("[getEntriesForTriplet] error:", err, { storeName, triplet: [r, l, u], meta });
    return { items: null, meta };
  }
}
async function getLatestAndPreviousByTriplet(raceId, legNum, userId, opts = {}) {
  const { items, meta } = await getEntriesForTriplet(raceId, legNum, userId, { ...opts, limit: 2 });
  const latest = (items == null ? void 0 : items[0]) ?? null;
  const previous = (items == null ? void 0 : items[1]) ?? null;
  return { latest, previous, meta };
}
async function getLegPlayersOptionsByRaceLeg(raceId, legNum, options = {}) {
  const { asMap = true } = options;
  const db = await openDatabase();
  try {
    const tx = db.transaction("legPlayersOptions", "readonly");
    const store = tx.objectStore("legPlayersOptions");
    let items = [];
    if (store.indexNames.contains("byRaceLeg")) {
      const idx = store.index("byRaceLeg");
      items = await idx.getAll([raceId, legNum]);
    } else {
      const idx = store.index("byTriplet");
      const range = IDBKeyRange.bound([raceId, legNum], [raceId, legNum, "￿"]);
      items = await idx.getAll(range);
    }
    await tx.done;
    if (!asMap)
      return items;
    return items.reduce((acc, it) => {
      if ((it == null ? void 0 : it.userId) != null)
        acc[it.userId] = it;
      return acc;
    }, {});
  } finally {
    db.close();
  }
}
const userPrefsDefault = {
  /**/
  router: (
    /**/
    {
      /**/
      auto: true,
      /**/
      sel: "zezo"
      /*Zezo VRzen Les deux"*/
      /**/
    }
  ),
  /**/
  nmea: (
    /**/
    {
      /**/
      enable: false,
      /**/
      port: 8081
      /*801 8082 8083 8084*/
      /**/
    }
  ),
  /**/
  theme: "dark",
  /*dark light */
  /**/
  lang: "fr",
  /*fr en*/
  global: {
    separatorPos: false,
    /* - dans pos*/
    alternateFilter: true,
    reuseTab: true,
    localTime: true,
    polarSite: "INC",
    /* toxxct inc lsv */
    ITYCSend: true
  },
  drawing: {
    fullScreen: false,
    ratio: 80
  },
  raceData: {
    lastCmd: false,
    VMGSpeed: false
  },
  raceLog: {
    hideLastCmd: false,
    column: {
      rank: true,
      DTL: true,
      DTF: true,
      vR: true,
      vC: true,
      foil: true,
      factor: true,
      stamina: true,
      deltaD: true,
      deltaT: true,
      position: true
    }
  },
  map: {
    trace: false,
    projectionLineLenght: 20,
    invisibleBuoy: false,
    showMarkers: false,
    showTracks: false,
    borderColor: "#0000FF",
    projectionColor: "#B56AFB"
  },
  fleet: {
    shortOption: true,
    cleaning: true,
    cleaningInterval: 5,
    column: {
      team: true,
      rank: true,
      raceTime: true,
      DTU: true,
      DTF: true,
      TWD: true,
      TWS: true,
      TWS: true,
      TWA: true,
      HDG: true,
      speed: true,
      VMG: true,
      sail: true,
      factor: true,
      foil: true,
      position: true,
      option: true,
      state: true,
      select: true
    }
  },
  sailRankId: "",
  separator: "sep_1",
  filters: {
    friends: true,
    opponents: false,
    certified: true,
    team: true,
    top: true,
    real: false,
    sponsors: true,
    inRace: false,
    selected: true
  }
};
let userPrefs = userPrefsDefault;
async function loadUserPrefs() {
  const dbUserPrefs = await getData("internal", "userPrefs").catch((error) => {
    console.error("getuserPrefs error :", error);
  });
  if ((dbUserPrefs == null ? void 0 : dbUserPrefs.prefs) == null) {
    userPrefs = userPrefsDefault;
    await saveUserPrefs(userPrefsDefault);
  } else
    userPrefs = dbUserPrefs.prefs;
  if (!userPrefs.filters) {
    userPrefs.filters = {
      friends: true,
      opponents: false,
      certified: true,
      team: true,
      top: true,
      real: false,
      sponsors: true,
      inRace: false,
      selected: true
    };
    await saveUserPrefs(userPrefs);
  }
}
async function saveUserPrefs(prefs) {
  await saveData("internal", { id: "userPrefs", prefs }, null, { updateIfExists: true });
  userPrefs = prefs;
}
function getUserPrefs() {
  return userPrefs;
}
function roundTo(number, digits) {
  if (number !== void 0 && !isNaN(number)) {
    var scale = Math.pow(10, digits);
    return (Math.round(number * scale) / scale).toFixed(digits);
  } else {
    return "-";
  }
}
function gcAngle(rlat0, rlon0, rlat1, rlon1) {
  return Math.acos(Math.sin(rlat0) * Math.sin(rlat1) + Math.cos(rlat0) * Math.cos(rlat1) * Math.cos(rlon1 - rlon0));
}
function toRad(angle2) {
  return angle2 / 180 * Math.PI;
}
function toDeg(angle2) {
  return angle2 / Math.PI * 180;
}
function angle(h0, h1) {
  return Math.abs(Math.PI - Math.abs(h1 - h0));
}
function gcDistance(pos0, pos1) {
  var radius = 3437.74683;
  var rlat0 = toRad(pos0.lat);
  var rlat1 = toRad(pos1.lat);
  var rlon0 = toRad(pos0.lon);
  var rlon1 = toRad(pos1.lon);
  return radius * gcAngle(rlat0, rlon0, rlat1, rlon1);
}
function courseAngle(lat0, lon0, lat1, lon1) {
  if (lon0 < lon1 + 2e-5 && lon0 > lon1 - 2e-5) {
    if (lat0 < lat1)
      return 0;
    else
      return Math.PI;
  }
  var rlat0 = toRad(lat0);
  var rlat1 = toRad(lat1);
  var rlon0 = toRad(lon0);
  var rlon1 = toRad(lon1);
  var xi = gcAngle(rlat0, rlon0, rlat1, rlon1);
  var a = Math.acos((Math.sin(rlat1) - Math.sin(rlat0) * Math.cos(xi)) / (Math.cos(rlat0) * Math.sin(xi)));
  return Math.sin(rlon1 - rlon0) > 0 ? a : 2 * Math.PI - a;
}
const guessOptionBits = {
  "hull": 1,
  "winch": 2,
  "foil": 4,
  "light": 8,
  "reach": 16,
  "heavy": 32,
  "hullDetected": 64,
  "foilDetected": 128,
  "winchDetected": 256,
  "hullActivated": 64 + 1,
  "foilActivated": 128 + 4,
  "winchActivated": 256 + 2,
  3: 32,
  //stay
  4: 8,
  //LJ
  5: 16,
  //C0
  6: 32,
  //HG
  7: 8
  //LG
};
function isBitSet(num, mask) {
  let a = num & mask;
  if (a === 0)
    return false;
  else
    return true;
}
function calculateCOGLoxo(LatDebDd, LonDebDd, LatFinDd, LonFinDd, useMercator = true) {
  var LdRad, GdRad, LfRad, GfRad, AbsDeltaG;
  var XMd, XMf, YMd, YMf, deltaXM, deltaYM;
  var HDGLoxo;
  LdRad = toRad(LatDebDd);
  GdRad = toRad(LonDebDd);
  LfRad = toRad(LatFinDd);
  GfRad = toRad(LonFinDd);
  AbsDeltaG = Math.abs(GdRad - GfRad);
  if (AbsDeltaG < Math.PI) {
    XMd = GdRad;
    XMf = GfRad;
  } else if (GdRad > GfRad) {
    XMd = GdRad - Math.PI;
    XMf = GfRad + Math.PI;
  } else {
    XMd = GdRad + Math.PI;
    XMf = GfRad - Math.PI;
  }
  if (useMercator) {
    YMd = Math.log(Math.tan(Math.PI / 4 + LdRad / 2));
    YMf = Math.log(Math.tan(Math.PI / 4 + LfRad / 2));
  } else {
    YMd = LdRad;
    YMf = LfRad;
  }
  deltaXM = XMf - XMd;
  deltaYM = YMf - YMd;
  if (deltaXM === 0) {
    if (YMf < YMd) {
      HDGLoxo = 180;
    } else if (YMf > YMd) {
      HDGLoxo = 0;
    } else if (deltaYM === 0) {
      HDGLoxo = "#N/A";
    }
  } else if (XMd < XMf) {
    HDGLoxo = 90 - Math.atan(deltaYM / deltaXM) * 180 / Math.PI;
  } else if (XMd > XMf) {
    HDGLoxo = 270 - Math.atan(deltaYM / deltaXM) * 180 / Math.PI;
  }
  return HDGLoxo;
}
function sign(x) {
  return x < 0 ? -1 : 1;
}
function isCurrent(timestamp) {
  return timestamp && timestamp > raceIte.previousIteDate;
}
const sailNames = [
  0,
  "Jib",
  "Spi",
  "Stay",
  "LJ",
  "C0",
  "HG",
  "LG",
  8,
  9,
  // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
  "Auto",
  "Jib &#x24B6;",
  "Spi &#x24B6;",
  "Stay &#x24B6;",
  "LJ &#x24B6;",
  "C0 &#x24B6;",
  "HG &#x24B6;",
  "LG &#x24B6;"
];
const sailColors = [
  "#FFFFFF",
  "#FF6666",
  "#6666FF",
  "#66FF66",
  "#FFF266",
  "#66CCFF",
  "#FF66FF",
  "#FFC44D",
  8,
  9,
  // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
  "#FFFFFF",
  "#FF6666",
  "#6666FF",
  "#66FF66",
  "#FFF266",
  "#66CCFF;",
  "#FF66FF",
  "#FFC44D"
];
const category = ["real", "certified", "top", "sponsor", "normal", "pilotBoat", "team"];
const categoryStyle = [
  // real
  { nameStyle: "color: Chocolate;", bcolor: "#D2691E", bbcolor: "#000000" },
  // certified
  { nameStyle: "color: Black;", bcolor: "#1E90FF", bbcolor: "#000000" },
  // top
  { nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: "#ffd700", bbcolor: "#000000" },
  // "sponsor"
  { nameStyle: "color: Black;", bcolor: "#D3D3D3", bbcolor: "#ffffff" },
  // "normal"
  { nameStyle: "color: Black;", bcolor: "#D3D3D3", bbcolor: "#000000" },
  // "normal"
  { nameStyle: "color: Black;", bcolor: "#000000" }
];
const categoryStyleDark = [
  // real
  { nameStyle: "color: Chocolate;", bcolor: "#D2691E", bbcolor: "#000000" },
  // certified
  { nameStyle: "color: #a5a5a5;", bcolor: "#1E90FF", bbcolor: "#000000" },
  // top
  { nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: "#ffd700", bbcolor: "#000000" },
  // "sponsor"
  { nameStyle: "color: #a5a5a5;", bcolor: "#D3D3D3", bbcolor: "#ffffff" },
  // "normal"
  { nameStyle: "color: #a5a5a5;", bcolor: "#D3D3D3", bbcolor: "#000000" },
  // "normal"
  { nameStyle: "color: #a5a5a5;", bcolor: "#000000" }
];
function switchTheme(theme) {
  if (theme == "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("rt_close_popupLmap").src = "./img/closedark.png";
    document.getElementsByClassName("popupCloseBt").src = "./img/closedark.png";
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    document.getElementById("rt_close_popupLmap").src = "./img/close.png";
    document.getElementsByClassName("popupCloseBt").src = "./img/close.png";
  }
}
function getBG(timestamp) {
  return isCurrent(timestamp) ? 'style="background-color: ' + (darkTheme ? "darkred" : "LightRed") + ';"' : "";
}
function pad0(val, length = 2, base = 10) {
  var result = val.toString(base);
  while (result.length < length)
    result = "0" + result;
  return result;
}
function formatHM(seconds) {
  if (seconds === void 0 || isNaN(seconds) || seconds < 0) {
    return "-";
  }
  seconds = Math.floor(seconds / 1e3);
  var hours = Math.floor(seconds / 3600);
  seconds -= 3600 * hours;
  var minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  let ret;
  if (hours != 0) {
    ret = pad0(hours, 1) + "h" + pad0(minutes) + "m";
  } else {
    ret = pad0(minutes, 1) + "m";
  }
  return ret;
}
function formatTimeNotif(ts) {
  var tsOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: false
  };
  var d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}
function formatTime(ts, format = 0) {
  const userPrefs2 = getUserPrefs();
  let tsOptions = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  };
  if (format == 1) {
    tsOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: false
    };
  }
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  if (!userPrefs2.global.localTime) {
    tsOptions.timeZone = "UTC";
  }
  return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}
function formatDHMS(seconds) {
  if (seconds === void 0 || isNaN(seconds) || seconds < 0) {
    return "-";
  }
  seconds = Math.floor(seconds / 1e3);
  var days = Math.floor(seconds / 86400);
  var hours = Math.floor(seconds / 3600) % 24;
  var minutes = Math.floor(seconds / 60) % 60;
  let retVal = "";
  if (days != 0)
    retVal = pad0(days) + "d " + pad0(hours) + "h " + pad0(minutes) + "m";
  else if (hours != 0)
    retVal = pad0(hours) + "h " + pad0(minutes) + "m";
  else
    retVal = pad0(minutes) + "m";
  return retVal;
}
function formatShortDate(ts, dflt, timezone) {
  if (!ts && dflt)
    return dflt;
  if (ts == "-")
    return "-";
  const date = new Date(ts);
  var month, day, hours, minutes, utcDate;
  if (!timezone) {
    utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
    month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
    day = utcDate.getUTCDate().toString().padStart(2, "0");
    hours = utcDate.getUTCHours().toString().padStart(2, "0");
    minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
  } else {
    month = (date.getMonth() + 1).toString().padStart(2, "0");
    day = date.getDate().toString().padStart(2, "0");
    hours = date.getHours().toString().padStart(2, "0");
    minutes = date.getMinutes().toString().padStart(2, "0");
  }
  return `${day}/${month} ${hours}:${minutes}`;
}
function twaBackGround(currTwa, bestTwa) {
  var twaBG = " ";
  var currentTWA = Math.round(Math.abs(currTwa));
  var bTwaUp = Math.round(bestTwa.twaUp);
  var bTwaDw = Math.round(bestTwa.twaDown);
  if (currentTWA == bTwaUp || currentTWA == bTwaDw)
    twaBG = " background-color:lightgreen;";
  else if (currentTWA < bTwaUp && currentTWA >= bTwaUp - 2 || currentTWA > bTwaDw && currentTWA <= bTwaDw + 2)
    twaBG = " background-color:DarkOrange;";
  else if (currentTWA < bTwaUp - 2 || currentTWA > bTwaDw + 2)
    twaBG = " background-color:DarkRed;";
  return twaBG;
}
function gentdRacelog(className, name, style, title, value) {
  var _a;
  const userPrefs2 = getUserPrefs();
  const checked = (_a = userPrefs2 == null ? void 0 : userPrefs2.racelog) == null ? void 0 : _a.column[name];
  if (!style || style === null)
    style = "";
  if (checked == void 0 || checked) {
    return '<td class="' + className + '" ' + style + (title ? ' title="' + title + '"' : "") + " >" + value + "</td>";
  } else {
    return "";
  }
}
function genthRacelog(id, name, content, title) {
  var _a;
  const userPrefs2 = getUserPrefs();
  const checked = (_a = userPrefs2 == null ? void 0 : userPrefs2.racelog) == null ? void 0 : _a.column[name];
  if (checked == void 0 || checked) {
    return '<th id="' + id + '"' + (title ? ' title="' + title + '"' : "") + ">" + content + "</th>";
  } else {
    return "";
  }
}
function genth(id, content, title, sortfield, sortmark) {
  var _a;
  const userPrefs2 = getUserPrefs();
  let checkboxId = "";
  if (!content) {
    id.split("_")[1];
    checkboxId = id.split("_")[1].toLowerCase();
  } else
    checkboxId = id;
  const checked = (_a = userPrefs2 == null ? void 0 : userPrefs2.fleet) == null ? void 0 : _a.column[checkboxId];
  if (checked == void 0 || checked) {
    if (sortfield && sortmark != void 0) {
      content = content + " " + (sortmark ? "&#x25b2;" : "&#x25bc;");
    }
    var cspan = "";
    if (id == "th_twa" || id == "th_sail") {
      cspan = "colspan = 2";
    }
    return "<th " + cspan + ' id="' + id + '"' + (sortfield ? ' style="background: DarkBlue;"' : "") + (title ? ' title="' + title + '"' : "") + ">" + content + "</th>";
  } else {
    return "";
  }
}
function gentd(name, style, title, value) {
  var _a;
  const userPrefs2 = getUserPrefs();
  const checked = (_a = userPrefs2 == null ? void 0 : userPrefs2.fleet) == null ? void 0 : _a.column[name];
  if (checked == void 0 || checked) {
    if (name == "fleet_sailicon") {
      var checkBoxSail = document.getElementById("fleet_sail");
      if (!checkBoxSail.checked)
        return "";
    } else if (name == "fleet_twaicon") {
      var checkBoxTWA = document.getElementById("fleet_twa");
      if (!checkBoxTWA.checked)
        return "";
    }
    return '<td class="' + name + '" ' + style + (title ? ' title="' + title + '"' : "") + " >" + value + "</td>";
  } else {
    return "";
  }
}
function getxFactorStyle(raceIte2) {
  const iteDash = raceIte2.metaDash;
  const userPrefs2 = getUserPrefs();
  const darkTheme2 = userPrefs2.theme == "dark";
  let xfactorStyle = 'style="color:' + (iteDash.xplained ? darkTheme2 ? "#a5A5A5" : "black" : "red") + ';"';
  if (!raceIte2.speed)
    xfactorStyle = 'style="color:' + darkTheme2 ? "#a5A5A5" : 'black;"';
  if (iteDash.sailCoverage != 0 && iteDash.xplained) {
    if (iteDash.sailCoverage > 1.2 || iteDash.sailCoverage < 0 && Math.abs(iteDash.sailCoverage) < 98)
      xfactorStyle = 'style="color:red;"';
    else if (iteDash.sailCoverage > 0)
      xfactorStyle = 'style="color:orange ;"';
  }
  return xfactorStyle;
}
function dateUTCSmall() {
  const userPrefs2 = getUserPrefs();
  const options = {
    year: "numeric",
    timeZoneName: "short"
  };
  if (!userPrefs2.global.localTime) {
    options.timeZone = "UTC";
  }
  const str = new Intl.DateTimeFormat("lookup", options).format(/* @__PURE__ */ new Date());
  const res = str.substring(5);
  return '<span class="small">&nbsp;(' + res + ")</span>";
}
function DateUTC(ts, format = 0) {
  if (!ts)
    return;
  let tsOptions = {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  };
  if (format == 1) {
    tsOptions = {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false
    };
  } else if (format == 2) {
    tsOptions = {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    };
  }
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  const dtUTCLocal = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
  tsOptions.timeZone = "UTC";
  const dtUTC = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
  return '<span id="UTC">' + dtUTC + '</span><span id="UTCLocal">' + dtUTCLocal + "</span>";
}
function raceTableHeaders() {
  return genthRacelog("th_rl_rank", "rank", "Rank") + genthRacelog("th_rl_dtl", "dtl", "DTL", "Distance To Leader") + genthRacelog("th_rl_dtf", "dtf", "DTF", "Distance To Finish") + genthRacelog("th_rl_twd", "twd", "TWD", "True Wind Direction") + genthRacelog("th_rl_tws", "tws", "TWS", "True Wind Speed") + genthRacelog("th_rl_twaLarge", "twa", "TWA", "True Wind Angle") + genthRacelog("th_rl_hdg", "hdg", "HDG", "Heading");
}
function raceTableLines(ite, bestTwa, bestDTF) {
  if (!ite) {
    return '<td class="rank"></td><td class="dtl"></td><td class="dtf"></td><td class="twd"></td><td class="tws"></td><td class="twa" ></td><td  class="hdg" ></td>';
  }
  const userPrefs2 = getUserPrefs();
  let isTWAMode = ite.isRegulated;
  let twaFG = ite.twa < 0 ? "red" : "green";
  let twaBold = isTWAMode ? "font-weight: bold;" : "";
  let twaBG = " ";
  if (bestTwa) {
    twaBG = twaBackGround(ite.twa, bestTwa);
  }
  var hdgFG = isTWAMode ? "black" : "blue";
  var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
  if (userPrefs2.theme == "dark")
    hdgFG = isTWAMode ? "white" : "darkcyan";
  return gentdRacelog("rank", "rank", null, "Rank", ite.rank ? ite.rank : "-") + gentdRacelog("dtl", "dtl", null, "DTL", bestDTF ? roundTo(ite.distanceToEnd - bestDTF, 3) : "-") + gentdRacelog("dtf", "dtf", null, "DTF", roundTo(ite.distanceToEnd, 3)) + '<td class="twd">' + roundTo(ite.twd, 3) + '</td><td class="tws">' + roundTo(ite.tws, 3) + '</td><td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold + '">' + roundTo(Math.abs(ite.twa), 3) + '</td><td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + roundTo(ite.hdg, 3) + "</td>";
}
function infoSail(ite, short, extended = true) {
  let sailInfo;
  const userPrefs2 = getUserPrefs();
  if (short) {
    sailInfo = sailNames[ite.sail % 10];
  } else
    sailInfo = '<span style="color:' + sailColors[ite.sail] + '" padding: 0px 0px 0px 2px;">&#x25e2&#x25e3  </span>' + sailNames[ite.sail % 10];
  if (ite.metaDash.isAutoSail) {
    const autoSailTime = ite.metaDash.autoSailTime == "inf" ? "∞" : formatHM(ite.metaDash.autoSailTime);
    sailInfo = sailInfo + " <span title='Auto Sails' class='cursorHelp'>&#x24B6;</span> " + autoSailTime;
  } else {
    sailInfo = sailInfo + " (Man)";
  }
  const sailNameBG = userPrefs2.theme == "dark" ? ite.badSail ? "darkred" : "darkgreen" : ite.badSail ? "lightred" : "lightgreen";
  if (ite.metaDash.deltaReceiveCompute > 9e5)
    sailNameBG = "red";
  let retVal = '<td class="asail" style="background-color:' + sailNameBG + ';">';
  if (extended) {
    const best = ite.metaDash.bVmg;
    if (best.sailTWSMax != 0) {
      retVal += '<div class="">' + best.sailTWSMin + " - " + best.sailTWSMax + " kts</div>";
    }
    retVal += "<div>" + sailInfo + "</div>";
    if (best.sailTWAMax != 0) {
      retVal += '<div class="">' + best.sailTWAMin + " - " + best.sailTWAMax + "°</div>";
    }
  } else {
    retVal += sailInfo;
  }
  retVal += "</td>";
  return retVal;
}
function toDMS(number) {
  const u = sign(number);
  number = Math.abs(number);
  const g = Math.floor(number);
  let frac = number - g;
  const m = Math.floor(frac * 60);
  frac = frac - m / 60;
  let s = Math.floor(frac * 3600);
  let cs = roundTo(36e4 * (frac - s / 3600), 0);
  while (cs >= 100) {
    cs = cs - 100;
    s = s + 1;
  }
  return {
    "u": u,
    "g": g,
    "m": m,
    "s": s,
    "cs": cs
  };
}
function formatPosition(lat, lon, long = false) {
  const latDMS = toDMS(lat);
  const lonDMS = toDMS(lon);
  const latString = latDMS.g + "°" + pad0(latDMS.m) + "'" + pad0(latDMS.s) + "." + pad0(latDMS.cs, 2) + '"';
  const lonString = lonDMS.g + "°" + pad0(lonDMS.m) + "'" + pad0(lonDMS.s) + "." + pad0(lonDMS.cs, 2) + '"';
  const userPrefs2 = getUserPrefs();
  const separator = userPrefs2.global.separatorPos ? " " : " - ";
  let retVal = long ? "<p>" : "";
  retVal += latString + (latDMS.u == 1 ? "N" : "S");
  retVal += long ? "</p><p>" : separator;
  retVal += lonString + (lonDMS.u == 1 ? "E" : "W");
  retVal += long ? "<p>" : "";
  return retVal;
}
function formatSeconds(value) {
  if (value < 0) {
    return "-";
  } else {
    return roundTo(value / 1e3, 0);
  }
}
function changeState(lbl_tochange) {
  const cbxlbl = lbl_tochange.replace("lbl_", "sel_");
  const selectedcbx = document.getElementById(cbxlbl);
  if (selectedcbx) {
    if (selectedcbx.checked) {
      selectedcbx.checked = false;
    } else {
      selectedcbx.checked = true;
    }
  }
  const name = lbl_tochange.replace("lbl_", "");
  const userPrefs2 = getUserPrefs();
  const checked = userPrefs2 == null ? void 0 : userPrefs2.filters[name];
  if (checked != void 0) {
    userPrefs2.filters[name] = selectedcbx.checked;
  }
  saveUserPrefs(userPrefs2);
}
function display_selbox(state) {
  document.getElementById("sel_skippers").style.visibility = state;
  document.getElementById("sel_export").style.visibility = state;
}
export {
  formatShortDate as A,
  categoryStyleDark as B,
  categoryStyle as C,
  DateUTC as D,
  isBitSet as E,
  guessOptionBits as F,
  display_selbox as G,
  changeState as H,
  saveUserPrefs as I,
  switchTheme as J,
  loadUserPrefs as K,
  createKeyChangeListener as L,
  processDBOperations as M,
  cfg as N,
  getLatestAndPreviousByTriplet as O,
  saveData as P,
  gcDistance as Q,
  courseAngle as R,
  angle as S,
  toRad as T,
  toDeg as U,
  calculateCOGLoxo as V,
  twaBackGround as W,
  getAllData as a,
  getLatestEntriesPerUser as b,
  getEntriesForTriplet as c,
  getLegPlayersOptionsByRaceLeg as d,
  roundTo as e,
  formatHM as f,
  getData as g,
  formatTimeNotif as h,
  raceTableLines as i,
  infoSail as j,
  getUserPrefs as k,
  genthRacelog as l,
  dateUTCSmall as m,
  formatPosition as n,
  formatSeconds as o,
  getxFactorStyle as p,
  gentdRacelog as q,
  raceTableHeaders as r,
  sailNames as s,
  getBG as t,
  genth as u,
  category as v,
  sailColors as w,
  gentd as x,
  formatTime as y,
  formatDHMS as z
};
//# sourceMappingURL=common-9e96a115.js.map
