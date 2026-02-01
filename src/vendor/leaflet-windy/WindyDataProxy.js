
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
            if (self.curr_dtg && self.curr_dtg.indexOf(e.data.transform_options.to_dtg) >= 0) {
              self.wind_layer.transformData(e.data.transform_options);
            }
          }
        };
      }
    }

    assignData(data, run_transform) {
        var self = this
        if (run_transform && self.wind_layer.is_active()) {
            let from_data = self.wind_layer.data()
            if (from_data) {
                if (self.worker) {
                    self.worker.postMessage({
                        from_data: from_data,
                        to_data: data
                    })
                }
                else {
                    let transform_options = WindyDataProxy.interpolateData(from_data, data)
                    self.wind_layer.transformData(transform_options)
                }
                return self;
            }
        }

        self.wind_layer.setData(data)
        return self
    }

    goto_dtg(dtg) {
        this._to_dtg(dtg, false)
    }

    transform_dtg(dtg) {
        // transform has bug
        // if trans to fast, they might showing wrong dtg
        this._to_dtg(dtg, true)
    }

    _to_dtg(dtg, run_transform) {
        var self = this
        self.curr_dtg = dtg
        if (dtg) {
            if (self.worker) {
                self.worker.postMessage({
                    data_uri: dtg,
                    transform: run_transform
                })
            }
            else {
                WindyDataProxy.fetchData(dtg, function(data) {
                    self.assignData(data)
                })
            }
        }
        else {
            self.assignData(null)
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
