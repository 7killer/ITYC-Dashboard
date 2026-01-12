
import L from '@/dashboard/ui/map/leaflet-setup';
import {getUserPrefs} from '../../../common/userPrefs.js'
import { mapState} from './map-race.js';
import {getRaceInfo} from '../../app/memoData.js'

let cachedTileList = [];
let coastDrawnState = false;

export async function initCachedTilesList()
{
    cachedTileList = [];
    await chrome.runtime.getPackageDirectoryEntry(dir => {
        dir.getDirectory('coasts', {}, function(cachedTilesDir) {
            new Promise(resolve => {
 
                let dirReader = cachedTilesDir.createReader();
            
                let getEntries = () => {
                    dirReader.readEntries((entries) => {
                            if (entries.length) {
                                for (var i = 0; i < entries.length; ++i) {
                                    cachedTileList.push(entries[i].name);
                                }
                                getEntries();
                            }
                        }
                    );
                };
                getEntries();
            })
        })
    });
}

export async function showCoastTiles()
{
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;

    const center = map.getCenter();
    const RANGE = 3;
    const GRID = 3;

    const clampLat = (lat) => Math.max(-90, Math.min(90, lat));

    const wrapLng = (lng) => {
        let x = lng;
        while (x > 180) x -= 360;
        while (x < -180) x += 360;
        return x;
    };

    const south = clampLat(center.lat - RANGE);
    const north = clampLat(center.lat + RANGE);
    const west = wrapLng(center.lng - RANGE);
    const east = wrapLng(center.lng + RANGE);

    // antiméridien 
    const crossesDateline = west > east;

    const snapDown = (v) => Math.floor(v / GRID) * GRID;
    const snapUp = (v) => Math.ceil(v / GRID) * GRID;

    const latitudeStart = snapDown(Math.min(south, north));
    const latitudeEnd = snapUp(Math.max(south, north));

    const coastsToLoad = [];

    const pushIfExists = (x, y) => {
        const id = `coast_polygons_${x}_${y}.geojson.gzip`;
        if (cachedTileList.includes(id)) coastsToLoad.push(id);
    };

    if (!crossesDateline) {
        const longitudeStart = snapDown(Math.min(west, east));
        const longitudeEnd = snapUp(Math.max(west, east));

        for (let x = longitudeStart; x <= longitudeEnd; x += 1) {
            for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
                pushIfExists(x, y);
            }
        }
    } else {
        // cas antiméridien : [west..180] U [-180..east]
        const start1 = snapDown(west);
        const end1 = 180;

        const start2 = -180;
        const end2 = snapUp(east);

        for (let x = start1; x <= end1; x += 1) {
            for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
                pushIfExists(x, y);
            }
        }
        for (let x = start2; x <= end2; x += 1) {
            for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
                pushIfExists(x, y);
            }
        }
    }
    coastLayersCleanAll(map);
    await Promise.all(
        coastsToLoad.map(async (id) => {
            const existing = mapState.coasts.get(id);
            if (existing) {
                existing.displayed = true;
            return;
            }

            try {
            const resp = await fetch(`../coasts/${id}`);
            if (!resp.ok) return;

            const blob = await resp.blob();
            const ds = new DecompressionStream("gzip");
            const decompressedStream = blob.stream().pipeThrough(ds);
            const jsonText = await new Response(decompressedStream).text();
            if (!jsonText) return;

            mapState.coasts.set(id, {
                id,
                json: JSON.parse(jsonText),
                layer: null,
                displayed: true,
            });
            } catch (e) {
            console.warn('coast fetch failed', id, e);
            }
        })
    );

    coastDrawAllLayers(map);

}

function coastDrawAllLayers(map,force=false)
{
    mapState.coasts.forEach(mapCoast =>  {
        if(mapCoast.displayed)
        {
            if(force) mapCoast.layer = null;
            if(!mapCoast.layer) {
                mapCoast.layer =  L.layerGroup();
                mapCoast.layer.__tag = 'coastLines';
                L.geoJSON(mapCoast.json,{style: styleLines}).addTo(mapCoast.layer);
            }
            mapCoast.layer.addTo(map);
        }
    });
    coastDrawnState = true;
}

export function coastLayersCleanAll(map,force=false)
{
    map = map?map:mapState.map;
    if(!map || (!coastDrawnState && !force)) return;

    map.eachLayer(l => {
        if (l.__tag && l.__tag === 'coastLines') {map.removeLayer(l);}
    });
    mapState.coasts.forEach(mapCoast => {
        if(!force) mapCoast.displayed = false;
    //    if(mapCoast.layer) map.removeLayer(mapCoast.layer);
    });
    coastDrawnState = false;
}
function styleLines(feature) {
    
    const userPrefs = getUserPrefs();
    const borderColor = userPrefs.map.borderColor;
    return {
        color: borderColor,
        weight: 1,
        opacity: .7
    };
}

export function onCoastColorChange() {
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    coastLayersCleanAll(map,true);
    coastDrawAllLayers(map,true);

}

