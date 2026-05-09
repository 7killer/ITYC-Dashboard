
import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js"

import {switchTheme,onUserChangeRace,uiFilterMode} from "../ui/common.js"
import {clickManager} from './clickManager.js'
import {hideShowTracks,onMarkersChange} from "../ui/map/map-routes.js"
import {onPopupOpenLmap, onPopupCloseLmap,onCleanAllRoute,onChangeRouteTypeLmap,
  onAddRouteLmap,onSkipperSelectedChange,showsMapHelp,onRouteListClick
} from '../ui/raceMap.js'
import {onCoastColorChange} from "../ui/map/map-coasts.js"
import {resetAllGraphsZoom} from "../ui/raceGraph.js"
import {applyRaceAnalysisMode, buildRaceAnalyseAdvance} from "../ui/raceAnalysis.js"
import {onFleetInCpyClipBoard, exportPolar, generateFleetCSV,
   exportGraphData, exportStamina, exportOwnBoatTrack, exportRestrictedZones} from "./exportTool.js"
import {getDoradoUrl} from "../../common/callExternal.js"


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
      onChange: async (value) => {onUserChangeRace(value)},
      onInit: (value, el) => { el.value = 0;}
    },
    {
      selector: '#bt_resetZoom',
      onChange: (value) => {resetAllGraphsZoom()},
    },
    {
      selector: '#doradoUrl',
      onChange: () => {getDoradoUrl()}
    },
    
/*    {
      selector: '#sel_lang',
      onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.lang = value;saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.lang}
    },*/
    {
      selector: '#auto_router',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.router.auto = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.router.auto }
    },
    {
      selector: '#sel_router',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.router.sel = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.router.sel}
    },
    {
      selector: '#nmea_output',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.nmea.requested = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.nmea.requested }
    },
    {
      selector: '#sel_nmeaport',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.nmea.port = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.nmea.port}
    },
    {
      selector: '#color_theme',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.theme = checked?"dark":"light";await saveUserPrefs(userPrefs);switchTheme(userPrefs.theme);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.theme=="dark"; switchTheme(userPrefs.theme);}
    },
    {
      selector: '#reuse_tab',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.global.reuseTab = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.reuseTab }
    },
    {
      selector: '#local_time',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.global.localTime = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.localTime }
    },
    {
      selector: '#uiFilterMode',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.global.alternateFilter = checked;await saveUserPrefs(userPrefs);uiFilterMode(userPrefs.global.alternateFilter);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.alternateFilter ;uiFilterMode(userPrefs.global.alternateFilter);}
    },
    {
      selector: '#vrzenPositionFormat',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.global.separatorPos = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.separatorPos }
    },
    {
      selector: '#ITYC_record',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.global.ITYCSend = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.global.ITYCSend }
    },
    {
      selector: '#analysis_mode_expert',
      onChange: async(checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.analysisMode = checked ? "expert" : "normal";
        await saveUserPrefs(userPrefs);
        if (checked) buildRaceAnalyseAdvance();
        else applyRaceAnalysisMode();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.analysisMode !== "normal";
      }
    },
    {
      selector: '#sel_polar_full_sail',
      onChange: async(checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.analysis.polarViewers.fullSail = checked;
        await saveUserPrefs(userPrefs);
        buildRaceAnalyseAdvance();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.analysis.polarViewers.fullSail;
      }
    },
    {
      selector: '#sel_polar_foil',
      onChange: async(checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.analysis.polarViewers.foil = checked;
        await saveUserPrefs(userPrefs);
        buildRaceAnalyseAdvance();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.analysis.polarViewers.foil;
      }
    },
    {
      selector: '#sel_polar_summit',
      onChange: async(checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.analysis.polarViewers.summit = checked;
        await saveUserPrefs(userPrefs);
        buildRaceAnalyseAdvance();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.analysis.polarViewers.summit;
      }
    },
    {
      selector: '#sel_polar_hole',
      onChange: async(checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.analysis.polarViewers.hole = checked;
        await saveUserPrefs(userPrefs);
        buildRaceAnalyseAdvance();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.analysis.polarViewers.hole;
      }
    },
    {
      selector: '#polar_spike_sensitivity',
      onChange: async(value, ev, el) => {
        const userPrefs = getUserPrefs();
        const parsed = parseFloat(el.value);
        const safeValue = Number.isFinite(parsed) ? parsed : 0.002;
        el.value = safeValue;
        userPrefs.analysis.polarViewers.spikeSensitivity = safeValue;
        await saveUserPrefs(userPrefs);
        buildRaceAnalyseAdvance();
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.analysis.polarViewers.spikeSensitivity;
      }
    },
    {
      selector: '#sel_polarSite',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.global.polarSite = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.global.polarSite}
    },
    {
      selector: '#fullScreen_Size',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.drawing.ratio = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.drawing.ratio}
    },
    {
      selector: '#fullScreen_Game',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.drawing.fullScreen = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.drawing.fullScreen }
    },
    {
      selector: '#showBVMGSpeed',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceData.VMGSpeed = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceData.VMGSpeed }
    },
    {
      selector: '#with_LastCommand',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceData.lastCmd = checked;await saveUserPrefs(userPrefs);},//todo add racestatus redraw
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceData.lastCmd }
    },
    {
      selector: '#hideCommandsLines',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.hideLastCmd = checked;await saveUserPrefs(userPrefs);},//todo add racelog redraw
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.hideLastCmd }
    },
    {
      selector: '#racelog_rank',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.rank = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.rank }
    },
    {
      selector: '#racelog_dtl',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.DTL = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.DTL }
    },
    {
      selector: '#racelog_dtf',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.DTF = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.DTF }
    },
    {
      selector: '#racelog_reportedSpeed',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.vR = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.vR }
    },
    {
      selector: '#racelog_calcSpeed',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.vC = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.vC }
    },
    {
      selector: '#racelog_foils',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.foil = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.foil }
    },

    {
      selector: '#racelog_factor',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.factor = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.factor }
    },

    {
      selector: '#racelog_stamina',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.stamina = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.stamina }
    },
    {
      selector: '#racelog_deltaDistance',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.deltaD = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.deltaD }
    },
    {
      selector: '#racelog_deltaTime',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.deltaT = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.deltaT }
    },
    {
      selector: '#racelog_position',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.raceLog.column.position = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.raceLog.column.position }
    },
    {
      selector: '#abbreviatedOption',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.shortOption = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.shortOption }
    },
    {
      selector: '#auto_clean',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.cleaning = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.cleaning }
    },  
    {
      selector: '#auto_cleanInterval',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.map.cleaningInterval = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.map.cleaningInterval}
    },
    {
      selector: '#sailRankRaceId',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.sailRankId = value;await saveUserPrefs(userPrefs);},
      onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.sailRankId}
    },
    {
      selector: '#sel_ExportFleet',
      onChange: async(checked, ev, el) => {
        await onFleetInCpyClipBoard();
        el.checked = true;
      },
      onInit: (checked, el) => { el.checked = true; }
    },
    {
      selector: '#bt_exportPolar',
      onChange: async() => { await exportPolar(); }
    },
    {
      selector: '#bt_exportFleet',
      onChange: async() => { generateFleetCSV(); }
    },
    {
      selector: '#bt_exportGraphData',
      onChange: async() => { exportGraphData(); }
    },
    {
      selector: '#bt_exportRestrictedZones',
      onChange: async() => { exportRestrictedZones(); }
    },
    {
      selector: '#bt_exportStamina',
      onChange: async() => { exportStamina(); }
    },
    {
      selector: '#bt_exportOwnBoatTrack',
      onChange: async() => { exportOwnBoatTrack(); }
    },
    {
      selector: '#fleet_team',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.team = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.team }
    },  
    {
      selector: '#fleet_rank',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.rank = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.rank }
    },  
    {
      selector: '#fleet_racetime',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.raceTime = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.raceTime }
    },  
    {
      selector: '#fleet_dtu',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.DTU = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.DTU }
    },  
    {
      selector: '#fleet_dtf',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.DTF = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.DTF }
    },  
    {
      selector: '#fleet_twd',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWD = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWD }
    },  
    {
      selector: '#fleet_tws',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWS = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWS }
    },  
    {
      selector: '#fleet_twa',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.TWA = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.TWA }
    },  
    {
      selector: '#fleet_hdg',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.HDG = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.HDG }
    },  
    {
      selector: '#fleet_speed',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.speed = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.speed }
    },  
    {
      selector: '#fleet_vmg',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.VMG = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.VMG }
    },
    {
      selector: '#fleet_sail',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.sail = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.sail }
    },  
    {
      selector: '#fleet_factor',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.factor = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.factor }
    },  
    {
      selector: '#fleet_foils',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.foil = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.foil }
    },  
    {
      selector: '#fleet_position',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.position = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.position }
    },  
    {
      selector: '#fleet_options',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.option = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.option }
    },  
    {
      selector: '#fleet_state',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.state = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.state }
    },  
    {
      selector: '#fleet_remove',
      onChange: async(checked) => {const userPrefs = getUserPrefs(); userPrefs.fleet.column.select = checked;await saveUserPrefs(userPrefs);},
      onInit: (checked, el) => {const userPrefs = getUserPrefs();  el.checked = userPrefs.fleet.column.select }
    },   
    {
      selector: '#sel_Seperator',
      onChange: async(value) => {const userPrefs = getUserPrefs(); userPrefs.separator = value;await saveUserPrefs(userPrefs);},
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
