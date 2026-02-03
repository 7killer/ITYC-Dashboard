
export class WindyDataProxy {

    constructor(wind_layer, workerOrUri) {
        this.wind_layer = wind_layer;
        this.curr_dtg = null;

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
                self.assignData(e.data.fetched_data, e.data.transform);
            }
            } else if (e.data.transform_options) {
            // ancien mode "transform", inutilisé avec leaflet-velocity
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

    /**
     * Convertit ce qui vient du worker (windpack snapshot) en payload leaflet-velocity.
     */
    static toVelocityPayload(raw) {
        if (!raw) return null;

        // Déjà au format leaflet-velocity ? -> on passe tel quel.
        if (Array.isArray(raw) && raw.length >= 2 && raw[0].header && raw[1].header) {
        return raw;
        }

        // Format "windpack" => { header, data: [uArray, vArray] }
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

        // leaflet-velocity attend un refTime en ISO
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
            header: { ...baseHeader, parameterNumber: 2 }, // UGRD
            data: u,
            },
            {
            header: { ...baseHeader, parameterNumber: 3 }, // VGRD
            data: v,
            },
        ];
        }

        console.warn('toVelocityPayload: format de données inconnu', raw);
        return null;
    }

    /**
     * Réception des données du worker => push vers la couche leaflet-velocity.
     * Le paramètre run_transform est ignoré (interpolation déjà faite dans le worker).
     */
    assignData(data /*, run_transform */) {
        const payload = WindyDataProxy.toVelocityPayload(data);

        if (!this.wind_layer || typeof this.wind_layer.setData !== 'function') {
        console.warn('WindyDataProxy.assignData: wind_layer sans setData');
        return this;
        }

        this.wind_layer.setData(payload);
        return this;
    }

    goto_dtg(dtg) {
        this._to_dtg(dtg, false);
    }

    transform_dtg(dtg) {
        // ancien mode "transform" (non utilisé avec interpolation par worker)
        this._to_dtg(dtg, true);
    }

    _to_dtg(dtg, run_transform) {
        const self = this;
        self.curr_dtg = dtg;
        if (dtg) {
        if (self.worker) {
            self.worker.postMessage({
            data_uri: dtg,
            transform: run_transform,
            });
        } else {
            WindyDataProxy.fetchData(dtg, function (data) {
            self.assignData(data);
            });
        }
        } else {
        self.assignData(null);
        }
    }

    interpolateBetween(urlPrev, urlNext, nowUnix) {
        // Label "dtg" pour cette interpolation (n’importe quelle string identifie l’état courant)
        const dtgLabel = `interp_${nowUnix}`;

        this.curr_dtg = dtgLabel;

        if (this.worker) {
            this.worker.postMessage({
                mode: 'interpolate',
                urlPrev,
                urlNext,
                nowUnix,
                dtg: dtgLabel,
            });
        } else {
            // Fallback éventuel : on pourrait ici faire l’interpolation sur le main thread,
            // mais vu que tu veux absolument le faire dans le worker, on peut juste logguer.
            console.warn('WindyDataProxy.interpolateBetween: aucun worker, pas d’interpolation');
        }
    }
    
    static strptime(date_str) {
        var _reg = new RegExp("(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})"),
            _rs = date_str.match(_reg),
            new_dt = new Date();

        new_dt.setFullYear(_rs[1])
        new_dt.setMonth(_rs[2])
        new_dt.setDate(_rs[3])
        new_dt.setHours(_rs[4])
        new_dt.setMinutes(_rs[5])
        new_dt.setSeconds(0)
        new_dt.setMilliseconds(0)
        return new_dt
    }

    static interpolateData(from_data, to_data) {
        // return { data:[], speed: int }
        var from_time = 0, to_time = 2,
            inter_datas = [], interp = 0,
            into_hours = 3, to_dtg = to_data.header.refTime;

        if (from_data.header.refTime && to_data.header.refTime) {
            if (from_data.header.refTime == to_data.header.refTime) {
                interp = 0
            }
            else {
                // interpolate into {into_hours} hour
                let t_from = WindyDataProxy.strptime(from_data.header.refTime),
                    t_to = WindyDataProxy.strptime(to_data.header.refTime),
                    to_time = parseInt((t_to - t_from)/(60*60*1000 * into_hours));
                interp = Math.abs(to_time - from_time)
            }
        }
        else {
            interp = Math.abs(to_time - from_time)
        }

        if (interp > 1) {
            let data_len = from_data.data[0].length

            for (let i=from_time; i<to_time; i++) {
                if (i == 0) {
                    inter_datas.push({header: from_data.header, data: from_data.data})
                    continue
                }

                let vdata = [], udata = [];
                for (let j=0; j<data_len; j++) {
                    let uf = from_data.data[0][j],
                        vf = from_data.data[1][j],
                        ut = to_data.data[0][j],
                        vt = to_data.data[1][j],
                        du = (ut - uf) / interp,
                        dv = (vt - vf) / interp;

                    udata.push(uf + (du * i))
                    vdata.push(vf + (dv * i))
                }

                inter_datas.push({
                    header: to_data.header,
                    data: [udata, vdata]
                })
            }
        }
        inter_datas.push({header: to_data.header, data: to_data.data})

        return { data: inter_datas, speed: (into_hours / interp), to_dtg: to_dtg}
    }

    static fetchData(uri, callback) {
        fetch(uri, {method: 'get'})
            .then(response => {
                if (response.ok) {
                    return Promise.resolve(response.json());
                }
                else {
                    return Promise.reject(new Error('Failed to load'));
                }
            })
            .then(data => {
                callback(data);
            })
            .catch(error => {
                callback({});
                console.log(`Error: ${error.message}`);
            })
    }
}

/*
onmessage = function(e) {
    if (e.data.data_uri) {
        var callback = function(data) {
            postMessage({ fetched_data: data, transform: e.data.transform, dtg: e.data.data_uri })
        }
        WindyDataProxy.fetchData(e.data.data_uri, callback)
    }
    else if (e.data.from_data && e.data.to_data) {
        let data_options = WindyDataProxy.interpolateData(e.data.from_data, e.data.to_data)
        postMessage({ transform_options: data_options })
    }
}*/
