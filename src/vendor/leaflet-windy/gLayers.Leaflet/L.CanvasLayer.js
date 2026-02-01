
/*
  Generic  Canvas Layer for leaflet 0.7 and 1.0-rc, 1.2, 1.3
  copyright Stanislav Sumbera,  2016-2018, sumbera.com , license MIT
  originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

  also thanks to contributors: heyyeyheman,andern,nikiv3, anyoneelse ?
  enjoy !
*/

// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);

    el.style[L.DomUtil.TRANSFORM] =
        (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
        (scale ? ' scale(' + scale + ')' : '');
};

// -- support for both  0.0.7 and 1.0.0 rc2 leaflet
L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
    // -- initialized is called on prototype
    initialize: function (options) {
        this._map    = null;
        this._canvas = null;
        this._frame  = null;
        this._delegate = null;
        L.setOptions(this, options);
    },

    delegate :function(del){
        this._delegate = del;
        return this;
    },

    needRedraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        }
        return this;
    },

    clear: function () {
        this._canvas1.getContext('2d').clearRect(0, 0, 3000, 3000);
        this._canvas2.getContext('2d').clearRect(0, 0, 3000, 3000);
    },

    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        var go_hide_canvas = null
        if (resizeEvent) {
            if (this._canvas == this._canvas2) {
                this._canvas = this._canvas1;
                L.DomUtil.removeClass(this._canvas1, 'leaflet-layer-hide');
                go_hide_canvas = this._canvas2;
            }
            else {
                this._canvas = this._canvas2;
                L.DomUtil.removeClass(this._canvas2, 'leaflet-layer-hide');
                go_hide_canvas = this._canvas1;
            }
        }
        this._canvas1.width = this._canvas2.width = resizeEvent.newSize.x;
        this._canvas1.height = this._canvas2.height = resizeEvent.newSize.y;

        // go_hide_canvas.getContext('2d').clearRect(0, 0, 3000, 3000);
        L.DomUtil.addClass(go_hide_canvas, 'leaflet-layer-hide');
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function () {
        if (this._canvas == this._canvas2) {
            this._canvas = this._canvas1;
            L.DomUtil.removeClass(this._canvas1, 'leaflet-layer-hide');
            go_hide_canvas = this._canvas2;
        }
        else {
            this._canvas = this._canvas2;
            L.DomUtil.removeClass(this._canvas2, 'leaflet-layer-hide');
            go_hide_canvas = this._canvas1;
        }
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();

        go_hide_canvas.getContext('2d').clearRect(0, 0, 3000, 3000);
        L.DomUtil.addClass(go_hide_canvas, 'leaflet-layer-hide');
    },
    _onLayerDidZoom: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();

        this._canvas.getContext('2d').clearRect(0, 0, 3000, 3000);
    },
    //-------------------------------------------------------------
    getEvents: function () {
        var events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove,
            zoomend: this._onLayerDidZoom
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            events.zoomanim =  this._animateZoom;
        }

        return events;
    },
    //-------------------------------------------------------------
    onAdd: function (map) {
        this._map = map;
        this._canvas1 = L.DomUtil.create('canvas', 'leaflet-layer leaflet-layer-fade');
        this._canvas2 = L.DomUtil.create('canvas', 'leaflet-layer leaflet-layer-fade');

        L.DomUtil.addClass(this._canvas2, 'leaflet-layer-hide');
        this._canvas = this._canvas1;

        var size = this._map.getSize();
        this._canvas1.width = size.x;
        this._canvas1.height = size.y;
        this._canvas2.width = size.x;
        this._canvas2.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas1, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        L.DomUtil.addClass(this._canvas2, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        map._panes.overlayPane.appendChild(this._canvas1);
        map._panes.overlayPane.appendChild(this._canvas2);

        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        map.on(this.getEvents(),this);

        var del = this._delegate || this;
        del.onLayerDidMount && del.onLayerDidMount(); // -- callback
        this.needRedraw();
    },

    //-------------------------------------------------------------
    onRemove: function (map) {
        var del = this._delegate || this;
        del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback

        if (this._frame) {
            L.Util.cancelAnimFrame(this._frame);
        }

        map.getPanes().overlayPane.removeChild(this._canvas1);
        map.getPanes().overlayPane.removeChild(this._canvas2);

        map.off(this.getEvents(),this);

        this._canvas = null;
    },

    //------------------------------------------------------------
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    // --------------------------------------------------------------------------------
    LatLonToMercator: function (latlon) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },

    //------------------------------------------------------------------------------
    drawLayer: function () {
        // -- todo make the viewInfo properties  flat objects.
        var size   = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoom   = this._map.getZoom();

        var center = this.LatLonToMercator(this._map.getCenter());
        var corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));

        var del = this._delegate || this;
        del.onDrawLayer && del.onDrawLayer({
            layer : this,
            canvas: this._canvas,
            bounds: bounds,
            size: size,
            zoom: zoom,
            center : center,
            corner : corner
        });
        this._frame = null;
    },
    // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
    //------------------------------------------------------------------------------
    _setTransform: function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
            (L.Browser.ie3d ?
                'translate(' + pos.x + 'px,' + pos.y + 'px)' :
                'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
            (scale ? ' scale(' + scale + ')' : '');
    },

    //------------------------------------------------------------------------------
    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom);
        // -- different calc of animation zoom  in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1
        var offset = L.Layer ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min :
                               this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        L.DomUtil.setTransform(this._canvas, offset, scale);
    }
});

L.canvasLayer = function () {
    return new L.CanvasLayer();
};
