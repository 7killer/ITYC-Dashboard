import { openDB, deleteDB } from 'idb';
import { paramStamina } from'./paramStamina.js';
import cfg from '@/config.json';


const DB_NAME = 'VRDashboardDB3';
const DB_VERSION = 5;

export async function openDatabase() {
    try {
        return await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('internal')) {
                    const store = db.createObjectStore('internal', { keyPath: 'id' });
                    if(cfg.debugDB) console.log('Created "internal" object store');
              
                    store.add({
//                      key: "paramStamina",
                      id: "paramStamina",
                      paramStamina: paramStamina
                    }) ;
                    store.add({
                        id : 'lastLoggedUser',
                        loggedUser : null
                    });
                    store.add({
                        id : 'lastOpennedRace',
                        raceId : null,
                        legNum : null,
                        lastOpennedRace : null
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
                        id: "playersTracksUpdate",
                        ts: Date.now()
                    });
                    store.add({
                        id: "state",
                        state: 'dashInstalled'
                    });
                }
                if (!db.objectStoreNames.contains('players')) {
                    db.createObjectStore('players', { keyPath: 'id' });
                    if(cfg.debugDB) console.log('Created "players" object store');
                }
                if (!db.objectStoreNames.contains('teams')) {
                    db.createObjectStore('teams', { keyPath: 'id' });
                    if(cfg.debugDB) console.log('Created "teams" object store');
                }
                if (!db.objectStoreNames.contains('polars')) {
                    db.createObjectStore('polars', { keyPath: 'id' });
                    if(cfg.debugDB) console.log('Created "polars" object store');
                }
                if (!db.objectStoreNames.contains('legList')) {
                    const store = db.createObjectStore('legList', {
                         keyPath: ['raceId', 'legNum']  });
                    if(cfg.debugDB) console.log('Created "legList" object store');
                }
                if (!db.objectStoreNames.contains('legFleetInfos')) {
                    const store = db.createObjectStore('legFleetInfos', {
                         keyPath: ['raceId', 'legNum', 'userId', 'iteDate']  });
                    store.createIndex('byTriplet', ['raceId', 'legNum', 'userId'], { unique: false });
                    if(cfg.debugDB) console.log('Created "legFleetInfos" object store');
                }
                if (!db.objectStoreNames.contains('legPlayersInfos')) {
                    const store = db.createObjectStore('legPlayersInfos', {
                         keyPath: ['raceId', 'legNum', 'userId', 'iteDate']  });
                    store.createIndex('byTriplet', ['raceId', 'legNum', 'userId'], { unique: false });
                    if(cfg.debugDB) console.log('Created "legPlayersInfos" object store');
                }
                if (!db.objectStoreNames.contains('legPlayersOrder')) {
                    const store = db.createObjectStore('legPlayersOrder', {
                         keyPath: ['raceId', 'legNum', 'userId', 'iteDate']  });
                    store.createIndex('byTriplet', ['raceId', 'legNum', 'userId'], { unique: false });
                    if(cfg.debugDB) console.log('Created "legPlayersOrder" object store');
                }
                if (!db.objectStoreNames.contains('legPlayersOptions')) {
                    const store = db.createObjectStore('legPlayersOptions', {
                         keyPath: ['raceId', 'legNum', 'userId']  });
                    store.createIndex('byTriplet', ['raceId', 'legNum', 'userId'], { unique: false });
                    store.createIndex('byRaceLeg', ['raceId', 'legNum'], { unique: false }); 
                    if(cfg.debugDB) console.log('Created "legPlayersOptions" object store');
                }
                if (!db.objectStoreNames.contains('playersTracks')) {
                    const store = db.createObjectStore('playersTracks', {
                         keyPath: ['raceId', 'legNum', 'userId', 'type' ]  });
                    store.createIndex('byTriplet', ['raceId', 'legNum', 'type'], { unique: false });
                    
                    if(cfg.debugDB) console.log('Created "playersTracks" object store');
                }
            }
        });
    } catch (error) {
        if(cfg.debugDBErr) console.error('Error opening database:', error);
        throw error;
    }
}

export async function putData(storeName, data) {
    try {
        const db = await openDatabase();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        await store.put(data);
        await tx.done;
        db.close();
        
        if(cfg.debugDB) console.log(`Data successfully added to ${storeName}:`, data);
    } catch (error) {
        if(cfg.debugDBErr) console.error(`Error adding data to ${storeName}:`, error);
        throw error;
    }
}
export async function putOrUpdate(storeName, data, key) {
    try {
        const db = await openDatabase();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const hasInlineKey = !!store.keyPath;

        // 🧩 Cas 1 : clé inline (keyPath défini)
        if (hasInlineKey) {
        const keyPath = store.keyPath;

        // Vérifie que la clé existe dans l'objet
        if (typeof keyPath === 'string' && (data[keyPath] === undefined || data[keyPath] === null)) {
            throw new Error(
            `putOrUpdate error: store "${storeName}" utilise keyPath="${keyPath}" mais data.${keyPath} est manquant`
            );
        }

        const recordKey = typeof keyPath === 'string' ? data[keyPath] : undefined;
        const existingItem = recordKey ? await store.get(recordKey) : null;

        if (existingItem) {
            await store.put({ ...existingItem, ...data });
            if(cfg.debugDB) console.log(`🟡 Updated item in ${storeName} (inline key):`, recordKey);
        } else {
            await store.put(data);
            if(cfg.debugDB) console.log(`🟢 Added new item to ${storeName} (inline key):`, recordKey);
        }

        // 🧩 Cas 2 : clé externe (pas de keyPath)
        } else {
        if (key === undefined || key === null) {
            throw new Error(`putOrUpdate error: missing 'key' for store "${storeName}" (no keyPath defined)`);
        }

        const existingItem = await store.get(key);

        if (existingItem) {
            await store.put({ ...existingItem, ...data }, key);
            if(cfg.debugDB) console.log(`🟡 Updated item in ${storeName} (explicit key):`, key);
        } else {
            await store.put(data, key);
            if(cfg.debugDB) console.log(`🟢 Added new item to ${storeName} (explicit key):`, key);
        }
        }

        await tx.done;
        db.close();

    } catch (error) {
        if(cfg.debugDBErr) console.error(`❌ putOrUpdate error in ${storeName}:`, error);
        throw error;
    }
}
  

export async function getData(storeName, key) {
    try {
        if (key === undefined || key === null) {
            throw new Error(
                `put error: missing 'key' parameter for store ${storeName}`
            );
        }
        const db = await openDatabase();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        
        const result = await store.get(key);
        await tx.done;
        db.close();
        
        if (result === undefined) {
            if(cfg.debugDB) console.warn(`No data found in ${storeName} for key:`, key);
        } else {
            if(cfg.debugDB) console.log(`Data retrieved from ${storeName} for key ${key}:`, result);
        }
        
        return result;
    } catch (error) {
        if(cfg.debugDBErr) console.error(`Error getting data from ${storeName}:`, error);
        throw error;
    }
}

export async function getAllData(storeName) {
  let db;
  try {
    db = await openDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    const result = await store.getAll();
    await tx.done;

    if (cfg.debugDB) console.log(`Retrieved all data from ${storeName}:`, result);
    return result;
  } catch (error) {
    if (cfg.debugDBErr) console.error(`Error getting all data from ${storeName}:`, error);
    throw error;
  } finally {
    try { db?.close(); } catch {}
  }
}


export async function deleteData(storeName, key) {
    try {
        if (key === undefined || key === null) {
            throw new Error(
                `delete error: missing 'key' parameter for store ${storeName}`
            );
        }
        const db = await openDatabase();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        await store.delete(key);
        await tx.done;
        db.close();
        
        if(cfg.debugDB) console.log(`Data with key ${key} deleted from ${storeName}`);
    } catch (error) {
        if(cfg.debugDBErr) console.error(`Error deleting data from ${storeName}:`, error);
        throw error;
    }
}


export async function saveData(storeName, data, key, options = {}) {
    const { updateIfExists = false } = options;
  
    try {
      const db = await openDatabase();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const hasInlineKey = !!store.keyPath;
  
      // Helper: calcule/valide la clé inline à partir du keyPath
      const resolveInlineKey = () => {
        const kp = store.keyPath;
        if (!kp) return undefined;
  
        if (typeof kp === 'string') {
          const v = data?.[kp];
          if (v === undefined || v === null) {
            throw new Error(`saveData: store "${storeName}" utilise keyPath="${kp}" mais data.${kp} est manquant`);
          }
          return v;
        }
  
        // keyPath composé (array)
        if (Array.isArray(kp)) {
          const arr = kp.map(k => {
            const v = data?.[k];
            if (v === undefined || v === null) {
              throw new Error(`saveData: store "${storeName}" keyPath composé ${JSON.stringify(kp)} → data.${k} manquant`);
            }
            return v;
          });
          return arr;
        }
  
        // Types exotiques non gérés
        throw new Error(`saveData: keyPath non supporté pour le store "${storeName}"`);
      };
  
      if (hasInlineKey) {
        // 🔒 Clé inline: on n'utilise PAS le paramètre key
        if (key !== undefined) {
          if(cfg.debugDB) console.warn(`[${storeName}] keyPath défini (${store.keyPath}) → param "key" ignoré`);
        }
  
        const recordKey = resolveInlineKey();
  
        if (updateIfExists) {
          const existing = await store.get(recordKey);
          if (existing) {
            await store.put({ ...existing, ...data }); // pas de 2e arg
            if(cfg.debugDB) console.log(`🟡 Updated (inline) in ${storeName}:`, recordKey);
          } else {
            await store.put(data);
            if(cfg.debugDB) console.log(`🟢 Insert (inline) in ${storeName}:`, recordKey);
          }
        } else {
          await store.put(data);
          if(cfg.debugDB) console.log(`💾 Saved (inline) in ${storeName}:`, recordKey);
        }
  
      } else {
        // 🔓 Clé externe (pas de keyPath)
        // Si autoIncrement, la key peut être omise
        const needsKey = !store.autoIncrement && (key === undefined || key === null);
        if (needsKey) {
          throw new Error(`saveData: store "${storeName}" sans keyPath et sans autoIncrement → "key" requis`);
        }
  
        if (updateIfExists) {
          const existing = (key !== undefined && key !== null) ? await store.get(key) : null;
          if (existing) {
            (key !== undefined && key !== null)
              ? await store.put({ ...existing, ...data }, key)
              : await store.put({ ...existing, ...data }); // autoIncrement
            if(cfg.debugDB) console.log(`🟡 Updated (explicit) in ${storeName}:`, key ?? '(autoIncrement)');
          } else {
            (key !== undefined && key !== null)
              ? await store.put(data, key)
              : await store.put(data); // autoIncrement
            if(cfg.debugDB) console.log(`🟢 Insert (explicit) in ${storeName}:`, key ?? '(autoIncrement)');
          }
        } else {
          (key !== undefined && key !== null)
            ? await store.put(data, key)
            : await store.put(data); // autoIncrement
          if(cfg.debugDB) console.log(`💾 Saved (explicit) in ${storeName}:`, key ?? '(autoIncrement)');
        }
      }
  
      await tx.done;
      db.close();
    } catch (error) {
      if(cfg.debugDBErr) console.error(`❌ Error saving data to ${storeName}:`, error);
      throw error;
    }
}
  


export function handleIndexedDBError(error, context = 'IndexedDB Operation') {
    if(cfg.debugDB) console.group(`❌ ${context} Error`);
    if(cfg.debugDBErr) console.error('Error Name:', error.name);
    if(cfg.debugDBErr) console.error('Error Message:', error.message);
    
    switch (error.name) {
        case 'AbortError':
            if(cfg.debugDB) console.warn('Transaction was aborted. This might be due to a constraint violation.');
            break;
        case 'ConstraintError':
            if(cfg.debugDB) console.warn('A constraint was violated. Check your key paths and indexes.');
            break;
        case 'QuotaExceededError':
            if(cfg.debugDB) console.warn('The database storage quota has been exceeded.');
            break;
        case 'UnknownError':
            if(cfg.debugDB) console.warn('An unknown error occurred. This might require further investigation.');
            break;
    }
    
    if(cfg.debugDB) console.trace('Error Stack Trace');
    if(cfg.debugDB) console.groupEnd();
}

export function processDBOperations(dbOperations) {
    dbOperations.forEach(operation => {
        const { type, ...stores } = operation; // Récupère le type d'opération et les stores concernés

        Object.entries(stores).forEach(([storeName, records]) => {
            if (Array.isArray(records)) {
                records.forEach(record => {
                    executeDBOperation(type, storeName, record);
                });
            }
        });
    });
}

export async function executeDBOperation(operation, storeName, data, callback = null) {
    try {
        switch (operation) {
            case "put":
                await saveData(storeName, data,data.key);
                break;

            case "get":
                const result = await getData(storeName, $data.key);
                if (callback) callback(result);
                return result;

            case "putOrUpdate":
                await saveData(storeName, data,data.key,{ updateIfExists: true });
                break;

            default:
                if(cfg.debugDBErr) console.error("Opération non reconnue :", operation);
                throw new Error(`Opération non reconnue : ${operation}`);
        }
    } catch (error) {
        if(cfg.debugDBErr) console.error(`Erreur lors de l'opération ${operation} sur ${storeName}:`, error);
        handleIndexedDBError(error, `DB Operation: ${operation}`);
        
        // Si un callback d'erreur est nécessaire
        if (callback && typeof callback === 'function') {
            callback(null, error);
        }
        
        throw error;
    }
}
export function createKeyChangeListener(storeName, key, options = {}) {
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
            if (!this.db) return;

            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const currentValue = await store.get(key);

                if (JSON.stringify(currentValue) !== JSON.stringify(this.initialValue)) {
                    const payload = {
                        newValue: currentValue,
                        oldValue: this.initialValue
                    };

                    console.log('🔁 Changement détecté :', payload);

                    if (typeof this.onChangeCallback === 'function') {
                        this.onChangeCallback(payload);
                    }

                    this.initialValue = currentValue;
                }

                await tx.done;
            } catch (err) {
                if(cfg.debugDBErr) console.error('💥 Erreur lors de la lecture dans readCurrentValue :', err);
            }
        },

        async start({ referenceValue = null, onChange = null } = {}) {
            if (this.isRunning) return;

            try {
                this.db = await openDatabase();
                this.onChangeCallback = onChange || null;

                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const currentValue = await store.get(key);
                await tx.done;

                if (referenceValue !== null) {
                    const isDifferent = JSON.stringify(currentValue) !== JSON.stringify(referenceValue);

                    if (isDifferent && typeof this.onChangeCallback === 'function') {
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
                        console.warn('⏱️ Timeout atteint sans changement.');
                    }
                }, timeout);

            } catch (error) {
                this.stop();
                if(cfg.debugDBErr) console.error('💥 Erreur lors du démarrage :', error);
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
            if(cfg.debugDB)console.warn('🔌 Listener interrompu manuellement.');
        }
    };

    return listener;
}


export async function getLatestEntriesPerUser(
    raceId,
    legNum,
    {
      timeout = 5000,
      since = Date.now() - 10 * 60 * 1000,
      until = Number.MAX_SAFE_INTEGER,
      maxUsers = 0,
      storeName = 'legPlayersInfos'
    } = {}
  ) {
    const r = Number(raceId);
    const l = Number(legNum);
    if (!Number.isFinite(r) || !Number.isFinite(l)) {
      if(cfg?.debugDBIteErr) console.error('[getLatestEntriesPerUser] Invalid arguments', { raceId, legNum });
      return { items: null, meta: { usersScanned: 0, usersTaken: 0, timedOut: false, reason: 'invalid-args', elapsedMs: 0, since, until } };
    }
  
    let db, tx;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  
    const job = (async () => {
      db = await openDatabase();
      tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
  
      if (!store.indexNames.contains('byTriplet')) {
        throw new Error(`[getLatestEntriesPerUser] Missing index 'byTriplet' on ${storeName}`);
      }
      const byTriplet = store.index('byTriplet');
  
      const userRange = IDBKeyRange.bound([r, l, ''], [r, l, '\uffff']);
  
      const mapByUser = Object.create(null);
      let usersScanned = 0;
      let reason = 'done';
  
      let uCursor = await byTriplet.openKeyCursor(userRange, 'nextunique');
      while (uCursor) {
        usersScanned++;
        const u = uCursor.key?.[2];
  
        const lower = [r, l, u, Math.max(0, Number(since) || 0)];
        const upper = [r, l, u, Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)];
        const range = IDBKeyRange.bound(lower, upper);
  
        let sCursor = await store.openCursor(range, 'prev');
        if (sCursor) {
          // le premier en 'prev' dans la fenêtre = dernière entrée dans [since, until]
          mapByUser[u] = sCursor.value;
        }
  
        if (maxUsers && Object.keys(mapByUser).length >= maxUsers) {
          reason = 'max-users-reached';
          break;
        }
  
        uCursor = await uCursor.continue();
      }
  
      await tx.done;
      db.close?.();
  
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const meta = {
        usersScanned,
        usersTaken: Object.keys(mapByUser).length,
        timedOut: false,
        reason,
        elapsedMs: Math.max(0, t1 - t0),
        since: Math.max(0, Number(since) || 0),
        until: Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)
      };
  
      if(cfg?.debugDBIte) console.debug('[getLatestEntriesPerUser] done', { leg: [r, l], meta });
  
      return { items: mapByUser, meta };
    })();
  
    try {
      return await withTimeout(job, timeout, () => {
        try { tx?.abort?.(); } catch {}
        try { db?.close?.(); } catch {}
      });
    } catch (err) {
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (String(err?.message || '').includes('Timeout')) {
        const meta = { usersScanned: 0, usersTaken: 0, timedOut: true, reason: 'timeout', elapsedMs: Math.max(0, t1 - t0), since, until };
        if(cfg?.debugDBIte) console.warn(`[getLatestEntriesPerUser] timeout after ${timeout}ms`, { leg: [r, l], meta });
        return { items: null, meta };
      }
      const meta = { usersScanned: 0, usersTaken: 0, timedOut: false, reason: 'error', elapsedMs: Math.max(0, t1 - t0), since, until };
      if(cfg?.debugDBIteErr) console.error('[getLatestEntriesPerUser] error:', err, { leg: [r, l], meta });
      return { items: null, meta };
    }
}

/**
 * Utility: fail a promise after ms (with optional best-effort cleanup).
 */
function withTimeout(promise, ms, onTimeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try { onTimeout?.(); } catch (_) {}
        reject(new Error(`Timeout after ${ms}ms`));
      }, ms);
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); }
      );
    });
  }
  
  /**
   * Retourne les entrées complètes d'un triplet triées du plus récent au plus ancien,
   * bornées temporellement (par défaut: DERNIÈRES 10 MINUTES).
   *
   * @param {number} raceId
   * @param {number} legNum
   * @param {string} userId
   * @param {object} [options]
   * @param {number} [options.limit=0]         - 0 = pas de limite (hormis la fenêtre temporelle)
   * @param {number} [options.timeout=5000]    - timeout en ms (retournera items=null si dépassé)
   * @param {number} [options.since]           - borne basse epoch ms (par défaut: now - 10min)
   * @param {number} [options.until]           - borne haute epoch ms (par défaut: +∞)
   * @param {string} [options.storeName='legPlayersInfos']
   * @returns {Promise<{items: Array<Object>|null, meta: {
   *   scanned:number, taken:number, timedOut:boolean, reason:string,
   *   elapsedMs:number, since:number, until:number
   * }}>}
   */
  export async function getEntriesForTriplet(
    raceId,
    legNum,
    userId,
    {
      limit = 0,
      timeout = 5000,
      since = Date.now() - 10 * 60 * 1000,         // 👉 dernière 10 minutes par défaut
      until = Number.MAX_SAFE_INTEGER,              // 👉 pas de plafond par défaut
      storeName = 'legPlayersInfos'
    } = {}
  ) {
    const r = Number(raceId);
    const l = Number(legNum);
    const u = String(userId ?? '').trim();
    if (!Number.isFinite(r) || !Number.isFinite(l) || !u) {
      const msg = '[getEntriesForTriplet] Invalid arguments';
      if(cfg?.debugDBIteErr) console.error(msg, { raceId, legNum, userId });
      return { items: null, meta: { scanned: 0, taken: 0, timedOut: false, reason: 'invalid-args', elapsedMs: 0, since, until } };
    }
  
    let db, tx;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  
    const job = (async () => {
      db = await openDatabase();
      tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
  
      // Plage bornée sur la clé primaire ['raceId','legNum','userId','iteDate']
      const lower = [r, l, u, Math.max(0, Number(since) || 0)];
      const upper = [r, l, u, Math.min(Number.MAX_SAFE_INTEGER, Number(until) || Number.MAX_SAFE_INTEGER)];
      const range = IDBKeyRange.bound(lower, upper);
  
      const results = [];
      let scanned = 0;
      let reason = 'done';
  
      // Parcours décroissant → plus récent d'abord
      let cursor = await store.openCursor(range, 'prev');
      while (cursor) {
        scanned++;
        const value = cursor.value;
        const iteDate = value?.iteDate ?? cursor.key?.[3];
  
        // Comme on est en desc, si on est déjà < since, on peut stopper net.
        if (iteDate < lower[3]) {
          reason = 'stopped-too-old';
          break;
        }
  
        results.push(value);
  
        if (limit && results.length >= limit) {
          reason = 'limit-reached';
          break;
        }
  
        cursor = await cursor.continue();
      }
  
      await tx.done;
      db.close?.();
  
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const meta = {
        scanned,
        taken: results.length,
        timedOut: false,
        reason,
        elapsedMs: Math.max(0, t1 - t0),
        since: lower[3],
        until: upper[3]
      };
  
      // Log d’observabilité
      if(cfg?.debugDBIte) console.debug('[getEntriesForTriplet] done', { storeName:storeName,triplet: [r, l, u], meta });
  
      return { items: results, meta };
    })();
  
    try {
      return await withTimeout(job, timeout, () => {
        try { tx?.abort?.(); } catch (_) {}
        try { db?.close?.(); } catch (_) {}
      });
    } catch (err) {
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (String(err?.message || '').includes('Timeout')) {
        const meta = {
          scanned: 0,
          taken: 0,
          timedOut: true,
          reason: 'timeout',
          elapsedMs: Math.max(0, t1 - t0),
          since,
          until
        };
        if(cfg?.debugDBIte) console.warn(`[getEntriesForTriplet] timeout after ${timeout}ms`, {storeName:storeName, triplet: [r, l, u], meta });
        return { items: null, meta };
      }
      const meta = {
        scanned: 0,
        taken: 0,
        timedOut: false,
        reason: 'error',
        elapsedMs: Math.max(0, t1 - t0),
        since,
        until
      };
      if(cfg?.debugDBIteErr) console.error('[getEntriesForTriplet] error:', err, { storeName:storeName,triplet: [r, l, u], meta });
      return { items: null, meta };
    }
  }
  
  /**
   * Raccourci: { latest, previous } sur la même fenêtre temporelle (10 min par défaut).
   * Si timeout/erreur → { latest:null, previous:null } + meta renvoyée aussi pour debug.
   */
  export async function getLatestAndPreviousByTriplet(
    raceId,
    legNum,
    userId,
    opts = {}
  ) {
    const { items, meta } = await getEntriesForTriplet(raceId, legNum, userId, { ...opts, limit: 2 });
    const latest = items?.[0] ?? null;
    const previous = items?.[1] ?? null;
    return { latest, previous, meta };
  }

/**
 * Récupère toutes les options joueurs pour un couple (raceId, legNum).
 * @param {number|string} raceId
 * @param {number|string} legNum
 * @param {{ asMap?: boolean }} [options]  - asMap=true => { [userId]: entry }
 * @returns {Promise<Array|Object>}        - tableau d’entrées ou map par userId
 */
export async function getLegPlayersOptionsByRaceLeg(raceId, legNum, options = {}) {
  const { asMap = true } = options;
  const db = await openDatabase();
  try {
    const tx = db.transaction('legPlayersOptions', 'readonly');
    const store = tx.objectStore('legPlayersOptions');

    let items = [];

    // ✅ chemin optimisé si l’index existe
    if (store.indexNames.contains('byRaceLeg')) {
      const idx = store.index('byRaceLeg');
      items = await idx.getAll([raceId, legNum]);
    } else {
      // 🔁 fallback sans ré-init DB : range prefix sur byTriplet
      // [raceId, legNum] … [raceId, legNum, '\uffff'] pour couvrir tous les userId (string)
      const idx = store.index('byTriplet');
      const range = IDBKeyRange.bound([raceId, legNum], [raceId, legNum, '\uffff']);
      items = await idx.getAll(range);
    }

    await tx.done;
    if (!asMap) return items;

    // { [userId]: entrée complète }
    return items.reduce((acc, it) => {
      if (it?.userId != null) acc[it.userId] = it;
      return acc;
    }, {});
  } finally {
    db.close();
  }
}

/**
 * Récupère toutes les options joueurs pour un couple (raceId, legNum, type).
 * @param {number|string} raceId
 * @param {number|string} legNum
 * @param {number|string} type
 * @param {{ asMap?: boolean }} [options]  - asMap=true => { [userId]: entry }
 * @returns {Promise<Array|Object>}        - tableau d’entrées ou map par userId
 */
export async function getLegPlayersTracksByType(raceId, legNum, type, options = {}) {
  const { asMap = true } = options;
  const db = await openDatabase();
  try {
    const tx = db.transaction('playersTracks', 'readonly');
    const store = tx.objectStore('playersTracks');

    let items = [];

    // ✅ chemin optimisé si l’index existe
    if (store.indexNames.contains('byType')) {
      const idx = store.index('byType');
      items = await idx.getAll([raceId, legNum, type]);
    } else {
      // 🔁 fallback sans ré-init DB : range prefix sur byTriplet
      // [raceId, legNum] … [raceId, legNum, '\uffff'] pour couvrir tous les byType (string)
      const idx = store.index('byTriplet');
      const range = IDBKeyRange.bound([raceId, legNum], [raceId, legNum, '\uffff']);
      items = await idx.getAll(range);
    }

    await tx.done;
    if (!asMap) return items;

    // { [userId]: entrée complète }
    return items.reduce((acc, it) => {
      if (it?.userId != null) acc[it.userId] = it;
      return acc;
    }, {});
  } finally {
    db.close();
  }
}
