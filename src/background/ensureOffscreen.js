const OFFSCREEN_PATH = 'offscreen.html'; 
let creating;

export async function ensureOffscreen() {
  const url = chrome.runtime.getURL(OFFSCREEN_PATH);

  const contexts = (await chrome.runtime.getContexts?.({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [url]
  })) || [];
  if (contexts.length) return;

  if (!creating) {
    creating = chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['WORKERS'],
      justification: 'Run CPU-intensive computations in dedicated worker'
    });
  }
  await creating;
  creating = null;
}
