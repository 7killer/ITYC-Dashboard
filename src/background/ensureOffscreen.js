// ensureOffscreen.js
const OFFSCREEN_PATH = 'offscreen.html';

let creatingPromise = null;

/**
 * Vérifie si le document offscreen dédié existe déjà.
 */
export async function hasOffscreenDocument(path = OFFSCREEN_PATH) {
  const offscreenUrl = chrome.runtime.getURL(path);

  // Chrome 116+
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl],
    });

    return contexts.length > 0;
  }

  // Fallback ancien Chrome
  const matchedClients = await clients.matchAll();
  return matchedClients.some((client) => client.url === offscreenUrl);
}

/**
 * Crée le document offscreen s'il n'existe pas déjà.
 * Concurrency-safe : si plusieurs appels arrivent en même temps,
 * un seul createDocument est réellement exécuté.
 */
export async function ensureOffscreen(path = OFFSCREEN_PATH) {
  if (await hasOffscreenDocument(path)) {
    return false; // déjà présent
  }

  if (creatingPromise) {
    await creatingPromise;
    return false;
  }

  creatingPromise = chrome.offscreen.createDocument({
    url: path,
    reasons: ['WORKERS'],
    justification: 'Run persistent NMEA timers and background transport outside the MV3 service worker',
  });

  try {
    await creatingPromise;
    return true; // créé maintenant
  } finally {
    creatingPromise = null;
  }
}

/**
 * Ferme explicitement le document offscreen s'il existe.
 */
export async function closeOffscreen(path = OFFSCREEN_PATH) {
  if (!(await hasOffscreenDocument(path))) {
    return false;
  }

  await chrome.offscreen.closeDocument();
  return true;
}

/**
 * Envoie un message au document offscreen en s'assurant qu'il existe.
 */
export async function sendToOffscreen(type, payload = {}, path = OFFSCREEN_PATH) {
  await ensureOffscreen(path);

  return await chrome.runtime.sendMessage({
    target: 'offscreen',
    type,
    ...payload,
  });
}

/**
 * Helper orienté NMEA.
 */
export async function startNmeaOffscreen(snapshot, path = OFFSCREEN_PATH) {
  return await sendToOffscreen('nmea/start', { snapshot }, path);
}

/**
 * Helper orienté NMEA.
 */
export async function stopNmeaOffscreen(snapshot = {}, path = OFFSCREEN_PATH) {
  return await sendToOffscreen('nmea/stop', { snapshot }, path);
}

/**
 * Helper orienté NMEA.
 */
export async function updateNmeaOffscreenSnapshot(snapshot, path = OFFSCREEN_PATH) {
  return await sendToOffscreen('nmea/updateSnapshot', { snapshot }, path);
}

/**
 * Debug helper.
 */
export async function getOffscreenNmeaState(path = OFFSCREEN_PATH) {
  return await sendToOffscreen('nmea/getState', {}, path);
}

export { OFFSCREEN_PATH };