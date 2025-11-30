
export function initButtonToCenterViewMap(lat, lon, map) {
    let recenterButton = document.querySelector("#lMap" + " #recenterButton");
    if (recenterButton) {
        updateCoordinatesToCenterViewMap(lat, lon);
    }
    else {
        // HTML
        let buttonHTML = `
        <div id="lMapControls" class="leaflet-control-custom leaflet-control leaflet-bar">
            <a id="recenterButton" title="Centrer" href="#">🎯</a>
        </div>`;
        let mapContainer = document.querySelector("#lMap" +  " .leaflet-top.leaflet-left");
        mapContainer.insertAdjacentHTML('afterbegin', buttonHTML);
        recenterButton = document.querySelector("#lMap" +  " #recenterButton");
        recenterButton.setAttribute('data-lat', lat);
        recenterButton.setAttribute('data-lon', lon);
        // Control
        recenterButton.addEventListener('click', function (e) {
            e.preventDefault();
            let defaultZoom = 10;
            if (map.getZoom() >= defaultZoom) defaultZoom = map.getZoom();
            let lat = parseFloat(recenterButton.getAttribute('data-lat'));
            let lon = parseFloat(recenterButton.getAttribute('data-lon'));
            map.setView([lat, lon], defaultZoom);
        });
    }
}
function updateCoordinatesToCenterViewMap(lat, lon) {
    let recenterButton = document.querySelector("#lMap" + " #recenterButton");
    if (recenterButton) {
        recenterButton.setAttribute('data-lat', lat);
        recenterButton.setAttribute('data-lon', lon);
    }
}

export function enableCoordinateCopyingWithShortcut() {
    const coordinatesDisplay = document.querySelector(".leaflet-control-coordinates");

    if (coordinatesDisplay) {
        document.addEventListener("keydown", function (event) {
            const isCtrlOrCmd = event.ctrlKey || event.metaKey; // Ctrl (Windows) ou Cmd (Mac)
            const isKeyC = event.key === "b" || event.key === "B"; // "b/B" on keyboard

            if (isCtrlOrCmd && isKeyC) {
                event.preventDefault();
                let coordinatesText = coordinatesDisplay.innerText.trim();
                coordinatesText = coordinatesText.replace(/\s+/g, '').replace(/([NS])(?=\d)/, '$1 ');
                coordinatesText && navigator.clipboard.writeText(coordinatesText).catch(console.error);
            }
        });
    }
}
