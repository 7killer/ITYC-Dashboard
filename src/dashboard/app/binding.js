
import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js"

import {switchTheme} from "../ui/common.js"
import {clickManager} from './clickManager.js'
import {hideShowTracks,onMarkersChange} from "../ui/map/map-routes.js"
import {onPopupOpenLmap, onPopupCloseLmap,onCleanAllRoute,onChangeRouteTypeLmap,
  onAddRouteLmap,onSkipperSelectedChange,showsMapHelp,onRouteListClick
} from '../ui/raceMap.js'
import {onCoastColorChange} from "../ui/map/map-coasts.js"


/**
 * Initialise des éléments UI avec gestion automatique des events et init
 * @param {Object[]} items - Liste de configuration
 * @param {string} items[].selector - Sélecteur CSS de l'élément
 * @param {(value: any, el: HTMLElement) => void} items[].onChange - Callback déclenché sur changement ou clic
 * @param {(value: any, el: HTMLElement) => void} [items[].onInit] - Callback déclenché à l'initialisation
 */
function initUIBindings(items) {
  items.forEach(({ selector, onChange, onInit }) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`⚠️ Élément non trouvé pour ${selector}`);
      return;
    }

    // --- Détermine le type d'événement à écouter ---
    let eventTypes = [];

    if (el.tagName === 'TABLE') {
      eventTypes = ['click', 'change'];
    }
    else if (['BUTTON', 'IMG', 'A', 'LABEL', 'DIV', 'SPAN'].includes(el.tagName)) {
      eventTypes = ['click'];
    }
    else if (el.tagName === 'INPUT') {
      const type = el.getAttribute('type') || 'text';
      if (['button', 'submit', 'image'].includes(type)) eventTypes = ['click'];
      else if (['number', 'text', 'range'].includes(type)) eventTypes = ['input'];
      else eventTypes = ['change'];
    }
    else if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      eventTypes = ['change', 'input'];
    }
    else {
      eventTypes = ['click'];
    }

    // --- Fonction pour extraire la valeur cohérente ---
    const getValue = (target = el) => {
      if (!target) return null;
      if (target.tagName === 'IMG') return target.src;
      if (target.tagName === 'SELECT') return target.value;
      if (target.tagName === 'BUTTON') return target.value || target.textContent;
      if (target.tagName === 'INPUT') {
        switch (target.type) {
          case 'checkbox': return target.checked;
          case 'number': return parseFloat(target.value);
          default: return target.value;
        }
      }
      return null;
    };

    // --- Ajout du listener ---
    eventTypes.forEach(eventType => {
      el.addEventListener(eventType, (ev) => {
        const target = ev.target;
        const val = getValue(target);
        onChange?.(val, ev, target);   // ✅ target réel + event
      });
    });

    // --- Callback d'init ---
    if (typeof onInit === 'function') {
      onInit(getValue(el), el);
    }
  });
}

export function uiBindingInit() {
  document.addEventListener("click", clickManager);
  initUIBindings([
    {
      selector: '#sel_race',
      onChange: (value) => {/*'internal', 'lastOpennedRace')*/},
      onInit: (value, el) => { el.value = 0;}
    },
/*    {
      selector: '#sel_lang',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.lang = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.lang}
    },*/
    {
      selector: '#auto_router',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.router.auto = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.router.auto }
    },
    {
      selector: '#sel_router',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.router.sel = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.router.sel}
    },
    {
      selector: '#nmea_output',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.nmea.enable = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.nmea.enable }
    },
    {
      selector: '#sel_nmeaport',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.nmea.port = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.nmea.port}
    },
    {
      selector: '#color_theme',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.theme = checked?"dark":"light";saveUserPrefs(userPrefs);switchTheme(userPrefs.theme);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.theme=="dark" }
    },
    {
      selector: '#reuse_tab',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.global.reuseTab = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.reuseTab }
    },
    {
      selector: '#local_time',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.global.localTime = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.localTime }
    },
    {
      selector: '#uiFilterMode',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.global.alternateFilter = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.alternateFilter }
    },
    {
      selector: '#vrzenPositionFormat',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.global.separatorPos = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.separatorPos }
    },
    {
      selector: '#ITYC_record',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.global.ITYCSend = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.ITYCSend }
    },
    {
      selector: '#sel_polarSite',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.global.polarSite = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.global.polarSite}
    },
    {
      selector: '#fullScreen_Size',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.drawing.ratio = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.drawing.ratio}
    },
    {
      selector: '#fullScreen_Game',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.drawing.fullScreen = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.drawing.fullScreen }
    },
    {
      selector: '#showBVMGSpeed',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceData.VMGSpeed = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceData.VMGSpeed }
    },
    {
      selector: '#with_LastCommand',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceData.lastCmd = checked;saveUserPrefs(userPrefs);},//todo add racestatus redraw
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceData.lastCmd }
    },
    {
      selector: '#hideCommandsLines',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.hideLastCmd = checked;saveUserPrefs(userPrefs);},//todo add racelog redraw
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.hideLastCmd }
    },
    {
      selector: '#racelog_rank',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.rank = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.rank }
    },
    {
      selector: '#racelog_dtl',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.DTL = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.DTL }
    },
    {
      selector: '#racelog_dtf',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.DTF = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.DTF }
    },
    {
      selector: '#racelog_reportedSpeed',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.vR = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.vR }
    },
    {
      selector: '#racelog_calcSpeed',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.vC = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.vC }
    },
    {
      selector: '#racelog_foils',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.foil = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.foil }
    },

    {
      selector: '#racelog_factor',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.factor = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.factor }
    },

    {
      selector: '#racelog_stamina',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.stamina = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.stamina }
    },
    {
      selector: '#racelog_deltaDistance',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.deltaD = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.deltaD }
    },
    {
      selector: '#racelog_deltaTime',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.deltaT = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.deltaT }
    },
    {
      selector: '#racelog_position',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.position = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.position }
    },
    {
      selector: '#track_infos',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.map.trace = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.map.trace }
    },
    {
      selector: '#projectionLine_Size',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.map.projectionLineLenght = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.projectionLineLenght}
    },
    {
      selector: '#view_InvisibleDoors',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.map.invisibleBuoy = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.map.invisibleBuoy }
    },
    {
      selector: '#abbreviatedOption',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.shortOption = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.shortOption }
    },
    {
      selector: '#auto_clean',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.cleaning = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.cleaning }
    },  
    {
      selector: '#auto_cleanInterval',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.map.cleaningInterval = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.cleaningInterval}
    },
    {
      selector: '#sailRankRaceId',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.map.sailRankId = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.sailRankId}
    },
    {
      selector: '#fleet_team',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.team = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.team }
    },  
    {
      selector: '#fleet_rank',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.rank = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.rank }
    },  
    {
      selector: '#fleet_racetime',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.raceTime = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.raceTime }
    },  
    {
      selector: '#fleet_dtu',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.DTU = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.DTU }
    },  
    {
      selector: '#fleet_dtf',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.DTF = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.DTF }
    },  
    {
      selector: '#fleet_twd',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWD = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWD }
    },  
    {
      selector: '#fleet_tws',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWS = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWS }
    },  
    {
      selector: '#fleet_twa',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWA = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWA }
    },  
    {
      selector: '#fleet_hdg',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.HDG = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.HDG }
    },  
    {
      selector: '#fleet_speed',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.speed = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.speed }
    },  
    {
      selector: '#fleet_vmg',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.VMG = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.VMG }
    },
    {
      selector: '#fleet_sail',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.sail = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.sail }
    },  
    {
      selector: '#fleet_factor',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.factor = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.factor }
    },  
    {
      selector: '#fleet_foils',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.foil = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.foil }
    },  
    {
      selector: '#fleet_position',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.position = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.position }
    },  
    {
      selector: '#fleet_options',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.option = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.option }
    },  
    {
      selector: '#fleet_state',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.state = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.state }
    },  
    {
      selector: '#fleet_remove',
      onChange: (checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.select = checked;saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.select }
    },   
    {
      selector: '#sel_Seperator',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.separator = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.separator}
    },
    {
      selector: '#bt_router',
      onChange: () => {/*todo call routerPage*/}
    },
    {
      selector: '#sel_showMarkersLmap',
      onChange: async (checked) => {const userPrefs = getUserPrefs(); userPrefs.map.showMarkers = checked?false:true;await saveUserPrefs(userPrefs);onMarkersChange(checked);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.map.showMarkers }
    },
    {
      selector: '#sel_showTracksLmap',
      onChange: async (checked) => {const userPrefs = getUserPrefs(); userPrefs.map.showTracks = checked?false:true;await saveUserPrefs(userPrefs);hideShowTracks(checked);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.map.showTracks }
    },  
    {
      selector: '#sel_borderColorLmap',
      onChange: async (value) => {const userPrefs = getUserPrefs(); userPrefs.map.borderColor = value;await saveUserPrefs(userPrefs);onCoastColorChange()},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.borderColor}
    },  
    {
      selector: '#sel_projectionColorLmap',
      onChange: async (value) => {const userPrefs = getUserPrefs(); userPrefs.map.projectionColor = value;await saveUserPrefs(userPrefs);/*onProjectionColorChange()*/},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.projectionColor}
    },
    {
      selector: '#projectionLine_Size',
      onChange: async (value) => {const userPrefs = getUserPrefs(); userPrefs.map.projectionLineLenght = value;await saveUserPrefs(userPrefs);/*onProjectionSizeChange()*/},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.projectionLineLenght}
    },
    {
      selector: '#lbl_rt_openLmap',
      onChange: () => {onPopupOpenLmap();}
    },
    {
      selector: '#rt_close_popupLmap',
      onChange: () => {onPopupCloseLmap();}
    },  
    {
      selector: '#sel_routeTypeLmap',
      onChange: (value) => {onChangeRouteTypeLmap();},
      onInit: (value, el) => {}
    },
    {
      selector: '#lbl_helpLmap',
      onChange: () => {showsMapHelp();}
    },
    {
      selector: '#route_list_tableLmap',
      onChange: (value,el,target) => {onRouteListClick(target);}
    },
    {
      selector: '#bt_rt_addLmap',
      onChange: async () => {await onAddRouteLmap();}
    },
    {
      selector: '#lbl_rt_cleanLmap',
      onChange: () => {onCleanAllRoute();}
    },
    {
      selector: '#sel_rt_skipperLmap',
      onChange: (value) => {onSkipperSelectedChange('Lmap');}
    }
  ]);
}
