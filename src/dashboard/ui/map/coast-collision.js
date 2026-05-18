import { point, lineString, polygon, multiPolygon } from '@turf/helpers';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import booleanIntersects from '@turf/boolean-intersects';
import cfg from '@/config.json';

import {
    ensureCoastTileLoaded,
    hasCachedCoastTile,
} from './map-coasts.js';

const polygonCache = new Map();
const bboxCache = new WeakMap();

function debugCool(...args) {
    if (cfg.debugCool) console.log('[debugCool][coast-collision]', ...args);
}

function getTileX(lon) {
    return Math.floor(lon);
}

function getTileY(lat) {
    return Math.ceil(lat);
}

function getTileXY(lat, lon) {
    return {
        x: getTileX(lon),
        y: getTileY(lat),
    };
}

function getTileId(lat, lon) {
    const { x, y } = getTileXY(lat, lon);
    const tileId = `coast_polygons_${x}_${y}.geojson.gzip`;
    debugCool('point tile selected', { lat, lon, x, y, tileId });
    return tileId;
}

function getSegmentCandidateTileIds(a, b) {
    const minLon = Math.floor(Math.min(a.lon, b.lon));
    const maxLon = Math.floor(Math.max(a.lon, b.lon));
    const minLat = getTileY(Math.min(a.lat, b.lat));
    const maxLat = getTileY(Math.max(a.lat, b.lat));

    const ids = [];

    for (let x = minLon; x <= maxLon; x++) {
        for (let y = minLat; y <= maxLat; y++) {
            const id = `coast_polygons_${x}_${y}.geojson.gzip`;
            if (hasCachedCoastTile(id)) ids.push(id);
        }
    }

    debugCool('segment tiles selected', {
        from: a,
        to: b,
        minLon,
        maxLon,
        minLat,
        maxLat,
        ids,
    });

    return ids;
}

function getPolygonsFromGeoJson(tileId, geojson) {
    if (polygonCache.has(tileId)) {
        return polygonCache.get(tileId);
    }

    const polygons = [];

    for (const feature of geojson?.features || []) {
        const geometry = feature.geometry;
        if (!geometry) continue;

        if (geometry.type === 'Polygon') {
            polygons.push(polygon(geometry.coordinates));
        } else if (geometry.type === 'MultiPolygon') {
            polygons.push(multiPolygon(geometry.coordinates));
        }
    }

    polygonCache.set(tileId, polygons);
    return polygons;
}

function getPolygonBbox(poly) {
    let b = bboxCache.get(poly);
    if (!b) {
        b = bbox(poly);
        bboxCache.set(poly, b);
        debugCool('getPolygonBbox computed', {
            geometryType: poly?.geometry?.type,
            bbox: b,
        });
    } else {
        debugCool('getPolygonBbox cached', {
            geometryType: poly?.geometry?.type,
            bbox: b,
        });
    }
    return b;
}

function pointInBbox(lat, lon, b) {
    return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
}

function bboxesIntersect(a, b) {
    return !(
        a[2] < b[0] ||
        a[0] > b[2] ||
        a[3] < b[1] ||
        a[1] > b[3]
    );
}

function getPolygonRings(poly) {
    const geometry = poly?.geometry;
    if (!geometry) return [];

    if (geometry.type === 'Polygon') {
        return geometry.coordinates || [];
    }

    if (geometry.type === 'MultiPolygon') {
        return (geometry.coordinates || []).flat();
    }

    return [];
}

function getSegmentIntersection(a, b, c, d) {
    const rLon = b.lon - a.lon;
    const rLat = b.lat - a.lat;
    const sLon = d.lon - c.lon;
    const sLat = d.lat - c.lat;
    const denom = rLon * sLat - rLat * sLon;

    if (Math.abs(denom) < 1e-12) return null;

    const cmaLon = c.lon - a.lon;
    const cmaLat = c.lat - a.lat;
    const t = (cmaLon * sLat - cmaLat * sLon) / denom;
    const u = (cmaLon * rLat - cmaLat * rLon) / denom;

    if (t < 0 || t > 1 || u < 0 || u > 1) return null;

    return {
        lat: a.lat + t * rLat,
        lon: a.lon + t * rLon,
        t,
    };
}

function findFirstSegmentPolygonIntersection(a, b, poly) {
    let first = null;

    for (const ring of getPolygonRings(poly)) {
        for (let i = 1; i < ring.length; i++) {
            const c = { lon: ring[i - 1][0], lat: ring[i - 1][1] };
            const d = { lon: ring[i][0], lat: ring[i][1] };
            const intersection = getSegmentIntersection(a, b, c, d);

            if (intersection && (!first || intersection.t < first.t)) {
                first = intersection;
            }
        }
    }

    return first;
}

async function getPolygonsForTile(tileId) {
    const coast = await ensureCoastTileLoaded(tileId, false);
    if (!coast?.json) return [];
    return getPolygonsFromGeoJson(tileId, coast.json);
}

export async function detectWaypointCoastCollisions(wpList = [], options = {}) {
    const {
        testPoints = true,
        testSegments = true,
    } = options;

    const collisions = [];

    for (let i = 0; i < wpList.length; i++) {
        const wp = wpList[i];
        if (wp?.lat == null || wp?.lon == null) continue;

        const idx = wp.idx ?? i;

        if (testPoints) {
            const tileId = getTileId(wp.lat, wp.lon);
            const polygons = await getPolygonsForTile(tileId);
            const turfPoint = point([wp.lon, wp.lat]);

            for (const poly of polygons) {
                const polyBbox = getPolygonBbox(poly);
                const inBbox = pointInBbox(wp.lat, wp.lon, polyBbox);
                debugCool('point bbox test', {
                    idx,
                    lat: wp.lat,
                    lon: wp.lon,
                    tileId,
                    polyBbox,
                    inBbox,
                });
                if (!inBbox) continue;

                const inPolygon = booleanPointInPolygon(turfPoint, poly);
                debugCool('booleanPointInPolygon', {
                    idx,
                    lat: wp.lat,
                    lon: wp.lon,
                    tileId,
                    geometryType: poly?.geometry?.type,
                    inPolygon,
                });

                if (inPolygon) {
                    collisions.push({
                        type: 'point-in-land',
                        idx,
                        routeIndex: i,
                        isCurrent: !!wp.isCurrent,
                        lat: wp.lat,
                        lon: wp.lon,
                        tileId,
                    });
                    break;
                }
            }
        }

        if (testSegments && i > 0) {
            const prev = wpList[i - 1];
            if (prev?.lat == null || prev?.lon == null) continue;

            const segment = lineString([
                [prev.lon, prev.lat],
                [wp.lon, wp.lat],
            ]);

            const segmentBbox = bbox(segment);
            const tileIds = getSegmentCandidateTileIds(prev, wp);

            let firstCollision = null;

            for (const tileId of tileIds) {
                const polygons = await getPolygonsForTile(tileId);

                for (const poly of polygons) {
                    const polyBbox = getPolygonBbox(poly);
                    if (!bboxesIntersect(segmentBbox, polyBbox)) continue;

                    if (booleanIntersects(segment, poly)) {
                        const intersection = findFirstSegmentPolygonIntersection(prev, wp, poly);
                        const candidate = {
                            type: 'segment-cross-land',
                            fromIdx: prev.idx ?? i - 1,
                            toIdx: idx,
                            idx,
                            fromRouteIndex: i - 1,
                            routeIndex: i,
                            lat: intersection?.lat ?? wp.lat,
                            lon: intersection?.lon ?? wp.lon,
                            targetLat: wp.lat,
                            targetLon: wp.lon,
                            t: intersection?.t ?? 1,
                            tileId,
                        };

                        debugCool('segment collision', {
                            fromIdx: prev.idx ?? i - 1,
                            toIdx: idx,
                            tileId,
                            intersection,
                            candidate,
                        });

                        if (!firstCollision || candidate.t < firstCollision.t) {
                            firstCollision = candidate;
                        }
                    }
                }
            }

            if (firstCollision) collisions.push(firstCollision);
        }
    }

    return collisions;
}
