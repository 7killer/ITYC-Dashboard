const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const dashboardUrl = 'moz-extension://ityc-test/dashboard.html';
let listener;
let filter;
let extraInfoSpec;
vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../js/osmTileHeaders.js'), 'utf8'),
    {
        URL,
        chrome: {
            runtime: { getURL: file => `moz-extension://ityc-test/${file}` },
            webRequest: {
                onBeforeSendHeaders: {
                    addListener(callback, requestFilter, options) {
                        listener = callback;
                        filter = requestFilter;
                        extraInfoSpec = options;
                    }
                }
            }
        }
    }
);

// Convert cross-context arrays/objects before comparing them with Node's assert.
const plain = value => JSON.parse(JSON.stringify(value));

test('registers a blocking listener only for HTTPS OSM tile images', () => {
    assert.deepEqual(plain(filter), {
        urls: ['https://tile.openstreetmap.org/*'],
        types: ['image']
    });
    assert.deepEqual(plain(extraInfoSpec), ['blocking', 'requestHeaders']);
});

test('identifies dashboard tiles while preserving all other headers', () => {
    const requestHeaders = [
        { name: 'User-Agent', value: 'Firefox test' },
        { name: 'Accept', value: 'image/png' },
        { name: 'If-None-Match', value: 'cached-tile' },
        { name: 'Referer', value: 'https://example.org/' }
    ];
    const originalHeaders = structuredClone(requestHeaders);
    const result = listener({
        documentUrl: `${dashboardUrl}?42#map`,
        requestHeaders
    });
    assert.deepEqual(plain(result.requestHeaders), [
        ...originalHeaders,
        { name: 'X-Requested-With', value: 'ITYC-Dashboard-Firefox' }
    ]);
    assert.deepEqual(requestHeaders, originalHeaders);
});

test('does not identify tiles from websites, other extensions or other pages', () => {
    for (const documentUrl of [
        'https://www.openstreetmap.org/',
        'https://ityc-test/dashboard.html',
        'moz-extension://other-extension/dashboard.html',
        'moz-extension://ityc-test/popup.html',
        `${dashboardUrl}.evil`,
        `${dashboardUrl}/extra`,
        'invalid-url',
        undefined
    ]) {
        assert.equal(listener({ documentUrl, requestHeaders: [] }), undefined);
    }
});

test('uses originUrl only when documentUrl is unavailable', () => {
    const result = listener({ originUrl: `${dashboardUrl}?42` });
    assert.deepEqual(plain(result.requestHeaders), [
        { name: 'X-Requested-With', value: 'ITYC-Dashboard-Firefox' }
    ]);
    assert.equal(listener({
        documentUrl: 'https://example.org/',
        originUrl: dashboardUrl,
        requestHeaders: []
    }), undefined);
});

test('replaces existing identification case-insensitively without duplicates', () => {
    const result = listener({
        documentUrl: dashboardUrl,
        requestHeaders: [
            { name: 'x-requested-with', value: 'old value' },
            { name: 'X-Requested-With', value: 'duplicate' }
        ]
    });
    const repeated = listener({ documentUrl: dashboardUrl, ...result });
    assert.deepEqual(plain(repeated.requestHeaders), [
        { name: 'X-Requested-With', value: 'ITYC-Dashboard-Firefox' }
    ]);
});
