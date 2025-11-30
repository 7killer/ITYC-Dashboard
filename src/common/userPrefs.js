
import {getData,saveData} from './dbOpes.js';



export const userPrefsDefault =
{
/**/    router :
/**/    {
/**/        auto : true,
/**/        sel : "zezo", /*Zezo VRzen Les deux"*/
/**/    },
/**/    nmea :
/**/    {
/**/        enable : false,
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
        polarSite : "INC", /* toxxct inc lsv */
        ITYCSend : true 
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
        trace : false,
        projectionLineLenght : 20,
        invisibleBuoy : false,
        showMarkers : false,
        showTracks : false,
        borderColor :"#0000FF",
        projectionColor :"#B56AFB",
        selectBaseMap : "Dark"
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
        friends : true,
        opponents : false,
        certified : true,
        team : true,
        top : true,
        real :false,
        sponsors : true,
        inRace : false,
        selected :true
    }
}



let userPrefs = userPrefsDefault;



export async function loadUserPrefs()
{
    const dbUserPrefs = await getData("internal","userPrefs")
                            .catch(error => {console.error("getuserPrefs error :", error);});
    if (dbUserPrefs?.prefs == null)
    {
        userPrefs = userPrefsDefault;
        await saveUserPrefs(userPrefsDefault);
    } else
        userPrefs = dbUserPrefs.prefs;
    if(!userPrefs.filters)
    {
        userPrefs.filters = {
            friends : true,
            opponents : false,
            certified : true,
            team : true,
            top : true,
            real :false,
            sponsors : true,
            inRace : false,
            selected :true
        };
        
        await saveUserPrefs(userPrefs);
    }
        
}
export async function saveUserPrefs(prefs)
{
    await saveData('internal', {id: "userPrefs",prefs:prefs},null,{ updateIfExists: true });
    userPrefs = prefs;

}

export function getUserPrefs()
{
    return userPrefs;
}