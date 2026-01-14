
import './css/style.css';

import {createKeyChangeListener} from '../common/dbOpes.js';

import {getConnectedPlayerId,setConnectedPlayerId,updateConnectedPlayerInfos,
getLegListUpdate, setLegListUpdate, updateLegList,
getPlayersUpdate, setPlayersUpdate, updatePlayersList,
getTeamsUpdate, setTeamsUpdate, updateTeamsList,
getPolarsUpdate, setPolarsUpdate, updatePolar,
getLegPlayersInfosUpdate, setLegPlayersInfosUpdate, updateLegPlayerInfos,
getLegPlayersOrderUpdate, setLegPlayersOrderUpdate, updateLegPlayersOrder,
getLegFleetInfosUpdate, setLegFleetInfosUpdate, updateLegFleetInfos,
getLegPlayersOptionsUpdate, setLegPlayersOptionsUpdate, updateLegPlayersOptions,
getLegPlayersTracksUpdate, setLegPlayersTracksUpdate,updateLegPlayersTracks,
getOpenedRaceId, setOpenedRaceId, updateOpenedRaceId,
initMemo

} from './app/memoData.js'
import {loadUserPrefs, getUserPrefs} from '../common/userPrefs.js'
import {onPlayerConnect, updateRaceListDisplay,onRaceOpen} from './ui/header.js'
import {buildRaceStatusHtml} from './ui/raceStatus.js'
import {uiBindingInit} from'./app/binding.js'
import {tabSwitch} from'./app/tab.js'
import {initCachedTilesList} from './ui/map/map-coasts.js'
import {raceGraphOnLoad} from'./ui/raceGraph.js'


let initDone = null;
let upDateDisplay =false;
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM start !');
    await loadUserPrefs();
    await initMemo();
    await initCachedTilesList();
    onPlayerConnect();
    doDbListener();
    updateRaceListDisplay(); 
    uiBindingInit();
    raceGraphOnLoad();
    buildRaceStatusHtml();
    tabSwitch();
    onRaceOpen();
    initializeDom();
    initDone = true;
    const repeater = startRepeating(() => {
        if(upDateDisplay)
        {
            tabSwitch();
            upDateDisplay = false;
          console.log("⏰ Display update ", new Date().toLocaleTimeString());
        }
    }, 5000);

// Pour l’arrêter plus tard :
    setTimeout(() => repeater.stop(), 20000); // stop après 20s
});

function initializeDom()
{
    document.getElementById("rt_popupLmap").style.display = "none";
    document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
}

function doDbListener() 
{
    const connectedUserListener = createKeyChangeListener('internal', 'lastLoggedUser');
    connectedUserListener.start({
        referenceValue: {loggedUser : getConnectedPlayerId()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue.loggedUser && initDone) {
                setConnectedPlayerId(newValue.loggedUser);
                await updatePlayersList();
                await updateTeamsList();
                await updateConnectedPlayerInfos();
                await updateLegPlayerInfos();
                await updateLegPlayersOrder();

                onPlayerConnect();    
            }
        }
    });

    const connectedLeglistListener = createKeyChangeListener('internal', 'legListUpdate');
    connectedLeglistListener.start({
        referenceValue: {ts : getLegListUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getLegListUpdate() && initDone)
            {   //updated infos
                setLegListUpdate(newValue.ts);
                await updateLegList();
                await updatePolar();
                updateRaceListDisplay(); 
                //update display map, fleet racestatus,, race book 
                buildRaceStatusHtml();
                tabSwitch();
            }
        }
    });
    const connectedPlayersListener = createKeyChangeListener('internal', 'playersUpdate');
    connectedPlayersListener.start({
        referenceValue: {ts : getPlayersUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getPlayersUpdate() && initDone)
            {   //updated infos
                setPlayersUpdate(newValue.ts);
                await updatePlayersList();
                await updateTeamsList();
                await updateConnectedPlayerInfos();
                await updateLegFleetInfos();
                await updateLegPlayerInfos();
                await updateLegPlayersOrder();
                tabSwitch();
                //update display connectedUser Fleet
            }
        }
    });

    const teamsListener = createKeyChangeListener('internal', 'teamsUpdate');
    teamsListener.start({
        referenceValue: {ts : getTeamsUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getTeamsUpdate() && initDone)
            {   //updated infos
                setTeamsUpdate(newValue.ts);
                await updateTeamsList();
                await updateConnectedPlayerInfos();
                await updateLegFleetInfos();
                await updateLegPlayerInfos();
                await updateLegPlayersOrder();
                tabSwitch();
                //update display connectedUser Fleet
            }
        }
    });


    const polarListener = createKeyChangeListener('internal', 'polarsUpdate');
    polarListener.start({
        referenceValue: {ts : getPolarsUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getPolarsUpdate() && initDone)
            {   //updated infos
                setPolarsUpdate(newValue.ts);
                await updatePolar();
                tabSwitch();
                //update display connectedUser Fleet polar page
            }
        }
    });

    const legPlayerInfosListener = createKeyChangeListener('internal', 'legPlayersInfosDashUpdate');
    legPlayerInfosListener.start({
        referenceValue: {ts : getLegPlayersInfosUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getLegPlayersInfosUpdate() && initDone)
            {   //updated infos
                setLegPlayersInfosUpdate(newValue.ts);
                await updateLegPlayerInfos();
                await updateLegPlayersOrder();      
                buildRaceStatusHtml();
                tabSwitch();
                //update display Fleet
            }
        }
    });

    const legFleetInfosListener = createKeyChangeListener('internal', 'legFleetInfosDashUpdate');
    legFleetInfosListener.start({
        referenceValue: {ts : getLegFleetInfosUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getLegFleetInfosUpdate() && initDone)
            {   //updated infos
                setLegFleetInfosUpdate(newValue.ts);
                await updateLegFleetInfos();
                //update display Fleet
                buildRaceStatusHtml();
                tabSwitch();
            }
        }
    });

    const legPlayersOptionsListener = createKeyChangeListener('internal', 'legPlayersOptionsUpdate');
    legPlayersOptionsListener.start({
        referenceValue: {ts : getLegPlayersOptionsUpdate()},
        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getLegPlayersOptionsUpdate() && initDone)
            {   //updated infos
                setLegPlayersOptionsUpdate(newValue.ts);
                await updateLegPlayersOptions();
                tabSwitch();
    //            await updateLegPlayerInfos();
    //            await updateLegPlayersOrder();
    //            await updateLegFleetInfos();
                //update display Fleet
            }
        }
    });

    const legPlayersOrdersListener = createKeyChangeListener('internal', 'legPlayersOrderUpdate');
    legPlayersOrdersListener.start({
        referenceValue: {ts : getLegPlayersOrderUpdate()},

        onChange: async ({ oldValue, newValue }) => {
            if(newValue?.ts != getLegPlayersOrderUpdate() && initDone)
            {   //updated infos
                setLegPlayersOrderUpdate(newValue.ts)
                await updateLegPlayersOrder();
                buildRaceStatusHtml();
                tabSwitch();
                //update display raceLog map,raceStatus
            }
        },
    });

    const connectedRaceListener = createKeyChangeListener('internal', 'lastOpennedRace');
    connectedRaceListener.start({
        referenceValue: (() => {
            const opened = getOpenedRaceId?.();
            return {
            raceId: opened?.raceId ?? null,
            legNum: opened?.legNum ?? null,
            };
        })(),

        onChange: async ({ oldValue, newValue }) => {
            const openedRace = getOpenedRaceId?.();

            const sameRace =
            newValue?.raceId === openedRace?.raceId &&
            newValue?.legNum === openedRace?.legNum;

            if (!sameRace && initDone) {
            // 🔄 Mise à jour des infos de course
            setOpenedRaceId(newValue?.raceId, newValue?.legNum);
            await updateOpenedRaceId();
            await updatePolar();
            await updateLegPlayersOptions();
            await updateLegFleetInfos();
            await updateLegPlayerInfos();
            await updateLegPlayersOrder();
            await updateLegPlayersTracks();
            onRaceOpen();
            buildRaceStatusHtml();
            tabSwitch();
            }
        },
    });
    const legPlayersTracksListener = createKeyChangeListener('internal', 'playersTracksUpdate');
    legPlayersTracksListener.start({
        referenceValue: {ts : getLegPlayersTracksUpdate()},

    onChange: async ({ oldValue, newValue }) => {
        if(newValue?.ts != getLegPlayersTracksUpdate() && initDone)
        {   //updated infos
            setLegPlayersTracksUpdate(newValue.ts);
            await updateLegPlayersTracks();
            tabSwitch();
            //update display raceLog map,raceStatus
        }
    },
    });
}

/* */
//updateRaceList

function startRepeating(callback, interval = 5000) {
  // Lancer immédiatement la première exécution (facultatif)
  callback();

  // Puis toutes les 5 secondes
  const id = setInterval(callback, interval);

  return {
    stop() {
      clearInterval(id);
      console.log("⏹️ Interval stopped");
    }
  };
}

