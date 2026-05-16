
import {createKeyChangeListener, getData, saveData} from './dbOpes.js';



export const userPrefsDefault =
{
/**/    router :
/**/    {
/**/        auto : true,
/**/        sel : "zezo", /*Zezo VRzen Les deux"*/
/**/    },
/**/    nmea :
/**/    {
/**/        requested : false,
/**/        port : 8081, /*801 8082 8083 8084*/
/**/    },
/**/    theme : "dark", /*dark light */
/**/    lang : "fr", /*fr en*/
    global : 
    {
        separatorPos : false , /* - dans pos*/
        alternateFilter : true,
        reuseTab : true,
        localTime : true,
        polarSite : "LSV", /* toxxct inc lsv */
        ITYCSend : true ,
        analysisMode : "expert"
    },
    drawing : 
    {
        fullScreen : false,
        ratio : 80
    },
    raceData :
    {
        lastCmd : false,
        VMGSpeed : false
    },
    analysis : {
        polarViewers : {
            fullSail : true,
            foil : true,
            summit : true,
            hole : true,
            spikeSensitivity : 0.002
        }
    },
    raceLog :
    {
        hideLastCmd : false,
        column : {
            rank : true,
            DTL  : true,
            DTF : true,
            vR : true,
            vC  : true,
            foil : true,
            factor : true,
            stamina : true,
            deltaD : true,
            deltaT : true,
            position : true
        }
    },
    map : {
        projectionLineLenght : 20,
        invisibleBuoy : false,
        showMarkers : false,
        showSailsMarkers : false,
        showTracks : false,
        borderColor :"#0000FF",
        projectionColor :"#B56AFB",
        selectBaseMap : "Dark",
        windMode : "default",
        windCustomMaxKts : 40,
        windTimeMode : "gfs"
    },
    fleet : {
        shortOption : true,
        cleaning : true,
        cleaningInterval : 5,
        column : {
            team : true,
            rank : true,
            raceTime : true,
            DTU : true,
            DTF : true,
            TWD : true,
            TWS  : true,
            TWS  : true,
            TWA  : true,
            HDG  : true,
            speed  : true,
            VMG  : true,
            sail  : true,
            factor : true,
            foil : true,
            position : true,
            option  : true,
            state : true,
            select : true
        }
    },
    sailRankId : "",
    separator : "sep_1" /* EU ; US , SailRank Tabs */,
    filters: {
        searchText: "",
        types: {
            team: "active",
            friends: "active",
            top: "active",
            sponsors: "active",
            certified: "active",
            opponents: "ignored",
            real: "ignored",
            selected: "active",
            inRace: "ignored",
            waiting: "ignored",
            arrived: "ignored"
        },
        teams: [],
        dynamic: []
    }
}



let userPrefs = userPrefsDefault;
let userPrefsListener = null;
let userPrefsListenerStarted = false;
let userPrefsInitPromise = null;

function normalizeUserPrefs(rawPrefs)
{
    const prefs = structuredClone(rawPrefs ?? userPrefsDefault);
    let shouldSave = false;

    if(!prefs.global)
    {
        prefs.global = structuredClone(userPrefsDefault.global);
        shouldSave = true;
    }

    if(!prefs.nmea)
    {
        prefs.nmea = structuredClone(userPrefsDefault.nmea);
        shouldSave = true;
    }

    if(!prefs.analysis)
    {
        prefs.analysis = structuredClone(userPrefsDefault.analysis);
        shouldSave = true;
    }

    if(!prefs.analysis.polarViewers)
    {
        prefs.analysis.polarViewers = structuredClone(userPrefsDefault.analysis.polarViewers);
        shouldSave = true;
    }

    if(typeof prefs.nmea.requested !== 'boolean')
    {
        prefs.nmea.requested = false;
        shouldSave = true;
    }

    if(prefs.nmea.port == null)
    {
        prefs.nmea.port = userPrefsDefault.nmea.port;
        shouldSave = true;
    }

    if(!prefs.filters)
    {
        prefs.filters = structuredClone(userPrefsDefault.filters);
        shouldSave = true;
    }
    else
    {
        const oldFilters = prefs.filters;
        if(!oldFilters.types)
        {
            prefs.filters = {
                searchText: "",
                types: {
                    team: oldFilters.team ? "active" : "ignored",
                    friends: oldFilters.friends ? "active" : "ignored",
                    top: oldFilters.top ? "active" : "ignored",
                    sponsors: oldFilters.sponsors ? "active" : "ignored",
                    certified: oldFilters.certified ? "active" : "ignored",
                    opponents: oldFilters.opponents ? "active" : "ignored",
                    real: oldFilters.real ? "active" : "ignored",
                    selected: oldFilters.selected ? "active" : "ignored",
                    inRace: oldFilters.inRace ? "active" : "ignored",
                    waiting: "ignored",
                    arrived: "ignored"
                },
                teams: [],
                dynamic: []
            };
            shouldSave = true;
        }

        if(typeof prefs.filters.searchText !== 'string')
        {
            prefs.filters.searchText = "";
            shouldSave = true;
        }

        if(!prefs.filters.types)
        {
            prefs.filters.types = structuredClone(userPrefsDefault.filters.types);
            shouldSave = true;
        }

        for (const [key, defaultState] of Object.entries(userPrefsDefault.filters.types))
        {
            if(!["ignored", "active", "excluded"].includes(prefs.filters.types[key]))
            {
                prefs.filters.types[key] = defaultState;
                shouldSave = true;
            }
        }

        if(!Array.isArray(prefs.filters.teams))
        {
            prefs.filters.teams = [];
            shouldSave = true;
        }

        if(!Array.isArray(prefs.filters.dynamic))
        {
            prefs.filters.dynamic = [];
            shouldSave = true;
        }

        const cleanFilters = {
            searchText: prefs.filters.searchText,
            types: Object.fromEntries(Object.keys(userPrefsDefault.filters.types).map((key) => [key, prefs.filters.types[key]])),
            teams: prefs.filters.teams,
            dynamic: prefs.filters.dynamic
        };
        if(Object.keys(prefs.filters).some((key) => !Object.hasOwn(cleanFilters, key)))
        {
            shouldSave = true;
        }
        prefs.filters = cleanFilters;
    }
    if(!prefs.map)
    {
        prefs.map = structuredClone(userPrefsDefault.map);
        shouldSave = true;
    }
    if(prefs.global.analysisMode == null)
    {
        prefs.global.analysisMode = userPrefsDefault.global.analysisMode;
        shouldSave = true;
    }
    if(!['default', 'custom', 'auto'].includes(prefs.map.windMode))
    {
        prefs.map.windMode = userPrefsDefault.map.windMode;
        shouldSave = true;
    }
    if(!Number.isFinite(Number(prefs.map.windCustomMaxKts)))
    {
        prefs.map.windCustomMaxKts = userPrefsDefault.map.windCustomMaxKts;
        shouldSave = true;
    }
    if(!['gfs', 'vr'].includes(prefs.map.windTimeMode))
    {
        prefs.map.windTimeMode = userPrefsDefault.map.windTimeMode;
        shouldSave = true;
    }

    for (const [key, defaultValue] of Object.entries(userPrefsDefault.analysis.polarViewers))
    {
        if(prefs.analysis.polarViewers[key] == null)
        {
            prefs.analysis.polarViewers[key] = defaultValue;
            shouldSave = true;
        }
    }
    
    return { prefs, shouldSave };
}

async function applyUserPrefs(rawPrefs, { persist = false } = {})
{
    const { prefs, shouldSave } = normalizeUserPrefs(rawPrefs);
    userPrefs = prefs;

    if (persist || shouldSave) {
        await saveData('internal', { id: "userPrefs", prefs }, null, { updateIfExists: true });
    }
}

function ensureUserPrefsListener()
{
    if (userPrefsListenerStarted) return;

    userPrefsListener = createKeyChangeListener('internal', 'userPrefs');
    userPrefsListener.start({
        referenceValue: { prefs: userPrefs },
        onChange: async ({ newValue }) => {
            if (newValue?.prefs == null) {
                await applyUserPrefs(userPrefsDefault, { persist: true });
                return;
            }

            await applyUserPrefs(newValue.prefs);
        },
    });
    userPrefsListenerStarted = true;
}



async function initUserPrefs()
{
    const dbUserPrefs = await getData("internal","userPrefs")
                            .catch(error => {console.error("getuserPrefs error :", error);});
    await applyUserPrefs(
        dbUserPrefs?.prefs ?? userPrefsDefault,
        { persist: dbUserPrefs?.prefs == null }
    );
    ensureUserPrefsListener();
}

export async function loadUserPrefs()
{
    if (!userPrefsInitPromise) {
        userPrefsInitPromise = initUserPrefs();
    }

    return userPrefsInitPromise;
}
export async function saveUserPrefs(prefs)
{
    await applyUserPrefs(prefs, { persist: true });

}

export function getUserPrefs()
{
    return userPrefs;
}

void loadUserPrefs();

