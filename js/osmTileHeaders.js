// Extension pages cannot send an HTTP(S) Referer. OSM supports identifying the
// application with X-Requested-With instead: https://wiki.openstreetmap.org/wiki/Referer
const osmDashboardUrl = new URL(chrome.runtime.getURL('dashboard.html'));

function identifyOsmTileRequest(details) {
    let sourceUrl;
    try {
        sourceUrl = new URL(details.documentUrl || details.originUrl);
    } catch {
        return;
    }

    // Only identify tiles loaded by this extension's dashboard, including ?tabId.
    // Compare protocol/host explicitly: extension URL origins can be "null".
    if (sourceUrl.protocol !== osmDashboardUrl.protocol ||
        sourceUrl.host !== osmDashboardUrl.host ||
        sourceUrl.pathname !== osmDashboardUrl.pathname) {
        return;
    }

    const requestHeaders = (details.requestHeaders || []).filter(
        header => header.name.toLowerCase() !== 'x-requested-with'
    );
    requestHeaders.push({
        name: 'X-Requested-With',
        value: 'ITYC-Dashboard-Firefox'
    });
    return { requestHeaders };
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    identifyOsmTileRequest,
    { urls: ['https://tile.openstreetmap.org/*'], types: ['image'] },
    ['blocking', 'requestHeaders']
);
