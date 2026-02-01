import { Windy } from './wind-js/windy.js'

L.WindyLayer = (L.Layer ? L.Layer : L.Class).extend({

    options: {
    },

    _map: null,
    _canvasLayer: null,
    _windy: null,
    _transform_animate: null,

    initialize: function(options) {
        L.setOptions(this, options)
    },

    onAdd: function(map) {
        let options = {};
        if (typeof this.options.opacity !== 'undefined') {
            options.opacity = this.options.opacity;
        }
        if (typeof this.options.pane !== 'undefined') {
            options.pane = this.options.pane;
        }
        if (typeof this.options.zIndex !== 'undefined') {
            options.zIndex = this.options.zIndex;
        }
        if (typeof this.options.className !== 'undefined') {
            options.className = this.options.className;
        }
        this._canvasLayer = L.windCanvas(options).delegate(this);
        this._canvasLayer.addTo(map);
        this._map = map;
    },

    onRemove: function(map) {
        this._destroyWind();
    },

    is_active: function() {
        return !!this._windy;
    },

    data: function() {
        return this.options.data;
    },

    transformData: function(transform_options) {
        var self = this;
        if (transform_options.data && transform_options.data.length > 0) {
            if (self._transform_animate) {
                cancelAnimationFrame(self._transform_animate);
            }
            self._transform_animate = null;

            if (self._windy && transform_options.speed) {
                var interpolated_data = transform_options.data,
                    interpolated_speed = transform_options.speed;
                self.transform_speed = self.options.transform_speed || 2000;
                self.transform_idx = 0;

                (function transform_animate() {
                    if (self.transform_idx >= 0 && self.transform_idx < interpolated_data.length) {
                        let data = interpolated_data[self.transform_idx];
                        self.setData(data);
                        if (self.transform_idx < interpolated_data.length - 1) {
                            self.transform_idx++;
                            self._transform_animate = setTimeout(
                                transform_animate,
                                self.transform_speed * interpolated_speed
                            );
                            return;
                        }
                    }
                    interpolated_data = [];
                }());
            }
            else {
                self.setData(transform_options.data[transform_options.data.length - 1]);
            }
        }
        return self;
    },

    setData: function(new_data) {
        // On ne parle plus à windy ici (pas de setData dans windy.js),
        // on stocke juste la data et on redéclenchera un start() au prochain draw.
        console.log('WindyLayer.setData', new_data && new_data.header);
        this.options.data = new_data;

        // Si windy existe déjà, on peut relancer directement l’anim avec les nouvelles données.
        if (this._windy && this._map) {
            var size = this._map.getSize();
            var bounds = this._map.getBounds();
            let params = this._buildParams(size, bounds); // [bounds, width, height, extent]
            this._windy.params.data = new_data;
            this._windy.start(params[0], params[1], params[2], params[3]);
        }

        return this;
    },

    onDrawLayer: function(params) {
        let [bounds, width, height, extent] = this._buildParams(params.size, params.bounds);

        if (!this.options.data) {
            return this;
        }

        if (!this._windy) {
            // Adaptation à windy.js : le constructeur prend un seul objet params
            this._windy = new Windy({
                canvas: params.canvas,
                data: this.options.data || []
            });
        } else {
            // On met à jour le canvas dans les params existants
            this._windy.params.canvas = params.canvas;
        }

        // On s’assure que windy a bien les données courantes
        if (this.options.data) {
            this._windy.params.data = this.options.data;
        }

        // IMPORTANT : on passe les bons arguments à start()
        this._windy.start(bounds, width, height, extent);

        return this;
    },

    _buildParams: function(size, bounds) {
        return[
            [
                [0, 0],
                [size.x, size.y]
            ],
            size.x,
            size.y,
            [
                [bounds._southWest.lng, bounds._southWest.lat],
                [bounds._northEast.lng, bounds._northEast.lat]
            ]
        ];
    },

    _destroyWind: function() {
        if (this._transform_animate) {
            cancelAnimationFrame(this._transform_animate);
            this._transform_animate = null;
        }
        if (this._windy) {
            // windy.js expose stop(), pas release()
            this._windy.stop();
            this._windy = null;
        }
        if (this._canvasLayer) {
            this._canvasLayer.clear();
            this._map.removeLayer(this._canvasLayer);
            this._canvasLayer = null;
        }
    }
});

L.windyLayer = function(options) {
    return new L.WindyLayer(options);
};
