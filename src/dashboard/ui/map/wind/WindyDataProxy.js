import { mapState } from '../map-race.js';
import { setWindAutoRangeFromWorker } from '../map-wind.js';
import cfg from '@/config.json';

export class WindyDataProxy {
    constructor(wind_layer, workerOrUri) {
        this.wind_layer = wind_layer;
        this.curr_dtg = null;
        this.lastAppliedKey = null;
        this.pendingResolve = null;
        this.pendingMeta = null;

        if (workerOrUri instanceof Worker) {
        this.worker = workerOrUri;
        } else if (workerOrUri) {
        this.worker = new Worker(workerOrUri);
        }

        if (this.worker) {
        const self = this;
        this.worker.onmessage = function (e) {
            if (e.data.fetched_data) {
            if (e.data.dtg === self.curr_dtg) {
                self.assignData(e.data.fetched_data, {
                    key: e.data.dtg,
                    autoMinKts: e.data.autoMinKts,
                    autoMaxKts: e.data.autoMaxKts,
                    workerTiming: e.data.timing,
                });
            }
            } else if (e.data.transform_options) {
            if (
                self.curr_dtg &&
                e.data.transform_options &&
                self.curr_dtg.indexOf(e.data.transform_options.to_dtg) >= 0 &&
                self.wind_layer &&
                typeof self.wind_layer.transformData === 'function'
            ) {
                self.wind_layer.transformData(e.data.transform_options);
            }
            }
        };
        }
    }

    static toVelocityPayload(raw) {
        if (!raw) return null;

        if (Array.isArray(raw) && raw.length >= 2 && raw[0].header && raw[1].header) {
        return raw;
        }

        if (raw.header && Array.isArray(raw.data) && raw.data.length >= 2) {
        const header = raw.header;
        const u = raw.data[0];
        const v = raw.data[1];

        if (!u || !v) {
            console.warn('toVelocityPayload: U/V manquants dans le snapshot', raw);
            return null;
        }

        const {
            lo1,
            la1,
            dx,
            dy,
            nx,
            ny,
            validTimeUnix,
            refTimeUnix,
        } = header;

        const refUnix = refTimeUnix || validTimeUnix;
        const refTime =
            typeof refUnix === 'number'
            ? new Date(refUnix * 1000).toISOString()
            : new Date().toISOString();

        const baseHeader = {
            parameterCategory: 2,
            lo1,
            la1,
            dx,
            dy,
            nx,
            ny,
            refTime,
        };

        return [
            {
            header: { ...baseHeader, parameterNumber: 2 },
            data: u,
            },
            {
            header: { ...baseHeader, parameterNumber: 3 },
            data: v,
            },
        ];
        }

        console.warn('toVelocityPayload: format de donnees inconnu', raw);
        return null;
    }

    assignData(data, meta = {}) {
        const t0 = performance.now();
        const payload = WindyDataProxy.toVelocityPayload(data);
        const tPayload = performance.now();

        if (!this.wind_layer || typeof this.wind_layer.setData !== 'function') {
        console.warn('WindyDataProxy.assignData: wind_layer sans setData');
        this._resolvePending({ applied: false, reason: 'missing-layer' });
        return this;
        }

        if (payload) {
            try {
            mapState.windSettings.lastData = payload;
            if (meta.autoMaxKts) {
                setWindAutoRangeFromWorker(meta.autoMaxKts, meta.autoMinKts);
            }
            } catch (e) {
            console.warn('Erreur mise a jour autoMaxKts', e);
            }
        }

        if (meta.key && meta.key === this.lastAppliedKey) {
            this._logTiming(meta, {
                payloadMs: tPayload - t0,
                skipped: true,
                reason: 'same-key',
            });
            this._resolvePending({ applied: false, reason: 'same-key' });
            return this;
        }

        const tSetData0 = performance.now();
        this.wind_layer.setData(payload);
        const tSetData1 = performance.now();
        this.lastAppliedKey = meta.key || null;
        const timing = {
            payloadMs: tPayload - t0,
            setDataSyncMs: tSetData1 - tSetData0,
            totalAssignMs: tSetData1 - t0,
            skipped: false,
        };
        this._logTiming(meta, timing);
        this._resolvePending({ applied: true, timing });
        return this;
    }

    goto_dtg(dtg) {
        return this._to_dtg(dtg, false);
    }

    transform_dtg(dtg) {
        return this._to_dtg(dtg, true);
    }

    _to_dtg(dtg, run_transform) {
        this.curr_dtg = dtg;
        const done = this._beginRequest(dtg, { mode: 'goto', startedAt: performance.now() });

        if (dtg) {
        if (this.worker) {
            this.worker.postMessage({
            data_uri: dtg,
            transform: run_transform,
            debugWind2: !!cfg.debugWind2,
            bounds: this._getCurrentBounds(),
            });
        } else {
            WindyDataProxy.fetchData(dtg, (data) => {
            this.assignData(data, { key: dtg });
            });
        }
        } else {
        this.assignData(null, { key: 'empty' });
        }

        return done;
    }

    interpolateBetween(urlPrev, urlNext, nowUnix) {
        const dtgLabel = `interp_${nowUnix}`;

        this.curr_dtg = dtgLabel;
        const done = this._beginRequest(dtgLabel, {
            mode: 'interpolate',
            nowUnix,
            startedAt: performance.now(),
        });

        if (this.worker) {
            this.worker.postMessage({
                mode: 'interpolate',
                urlPrev,
                urlNext,
                nowUnix,
                dtg: dtgLabel,
                debugWind2: !!cfg.debugWind2,
                bounds: this._getCurrentBounds(),
            });
        } else {
            console.warn('WindyDataProxy.interpolateBetween: aucun worker, pas d interpolation');
            this._resolvePending({ applied: false, reason: 'missing-worker' });
        }

        return done;
    }

    _beginRequest(key, meta = {}) {
        this._resolvePending({ applied: false, reason: 'superseded' });
        this.pendingMeta = { key, ...meta };
        return new Promise((resolve) => {
            this.pendingResolve = resolve;
            window.setTimeout(() => {
                if (this.pendingResolve === resolve) {
                    this.pendingResolve = null;
                    this.pendingMeta = null;
                    resolve({ applied: false, reason: 'timeout', key });
                }
            }, 10000);
        });
    }

    _resolvePending(result) {
        if (!this.pendingResolve) return;
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        const meta = this.pendingMeta;
        this.pendingMeta = null;
        resolve({ ...result, request: meta });
    }

    _logTiming(meta, timing) {
        if (!cfg.debugWind2) return;

        const req = this.pendingMeta;
        const now = performance.now();
        const roundtripMs = req?.startedAt ? now - req.startedAt : null;
        console.debug('[wind2][proxy]', {
            key: meta.key,
            mode: req?.mode,
            roundtripMs: roundtripMs != null ? Number(roundtripMs.toFixed(1)) : null,
            payloadMs: Number((timing.payloadMs || 0).toFixed(1)),
            setDataSyncMs: Number((timing.setDataSyncMs || 0).toFixed(1)),
            totalAssignMs: Number((timing.totalAssignMs || 0).toFixed(1)),
            skipped: timing.skipped,
            reason: timing.reason,
            autoMinKts: meta.autoMinKts,
            autoMaxKts: meta.autoMaxKts,
            worker: meta.workerTiming,
        });
    }

    _getCurrentBounds() {
        const bounds = mapState.map?.getBounds?.();
        if (!bounds || mapState.windSettings?.mode === 'custom') return null;
        const payload = {
            south: bounds.getSouth(),
            north: bounds.getNorth(),
            west: bounds.getWest(),
            east: bounds.getEast(),
        };
        if (cfg.debugWind3) {
            console.debug('[wind3][proxy] worker bounds', {
                mode: mapState.windSettings?.mode,
                bounds: payload,
            });
        }
        return payload;
    }

    static fetchData(uri, callback) {
        fetch(uri, { method: 'get' })
            .then(response => {
                if (response.ok) {
                    return Promise.resolve(response.json());
                }
                return Promise.reject(new Error('Failed to load'));
            })
            .then(data => {
                callback(data);
            })
            .catch(error => {
                callback({});
                console.log(`Error: ${error.message}`);
            });
    }
}
