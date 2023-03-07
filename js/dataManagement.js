/*************************************** TEAM LIST MANAGEMENT ***************************************/
    const teamModel = {
        teamId : "",
        teamName : "-",
        teamsize : "-",
        type : "-",
        desc : "-"
    };

    var TeamList = [];
    TeamList.uinfo = [];
    TeamList.table = [];
    TeamList.ts = 0;

    async function getTeamListLocal()
    {
        var teamListLocal =  await getLocal("TeamList");
        if (teamListLocal === undefined ) teamListLocal = [];
        TeamList.uinfo = teamListLocal;
    }

    async function createTeamList() {
        if(!TeamList)
        {
            TeamList = [];
            TeamList.uinfo = [];
            TeamList.table = [];
            TeamList.ts = 0;
        }
    }

    async function getTeamList() {
        await createTeamList();
        await getTeamListLocal();
        if((TeamList.ts < (Date.now()- 33*60*1000)) || TeamList.uinfo.length==0)
        {
            getTeamListITYC();
            await saveLocal("TeamList",TeamList.uinfo);
            await saveLocal("TeamList_ts",TeamList.ts); 
        }
        makeTeamTable();
    }
    
  
    async function saveTeamList() {
        await saveLocal("TeamList",TeamList.uinfo); 
    }

    var getTeamInProgress = false;
    async function getTeamListITYC() {
        if(getTeamInProgress) return TeamList;
        new Promise((resolve, reject) => {
            var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFRlYW1MaXN0LnBocA=="); 
            
            const xhr = new XMLHttpRequest();
            
            xhr.addEventListener('loadend', () => {
                
                getTeamInProgress = false;
                try {
                    if (xhr.status === 200 || xhr.status == 0) {
                        let itycTeamList = JSON.parse(xhr.responseText);
                        itycTeamList.shift(); //remove dummy team
                        itycTeamList.forEach(function (team) {
                            if(TeamList.uinfo[team.tid])
                                TeamList.uinfo[team.tid].teamName = team.teamName;
                            else
                            { 
                                var teamData = Object.create(teamModel);
                                teamData.teamId = team.tid;
                                teamData.teamName = team.teamName;
                                TeamList.uinfo[teamData.teamId] = teamData;
                            }   
                        });
                        resolve(true);
                    } else {    
                        resolve(false);
                    }
                }catch {
                    resolve(false);
                }
            });
            getTeamInProgress = true;
            xhr.open("GET", getUrl);
            xhr.send();
    
        });
        return TeamList;
    }

    function getTeamInfos(teamID)
    {
        return TeamList.uinfo[teamID];
    }
    function createEmptyTeam()
    {
        if(!TeamList.uinfo["None"]) {
            TeamList.uinfo["None"] = [];
            TeamList.uinfo["None"].teamId = "None";
            TeamList.uinfo["None"].teamName = "Aucune";
            TeamList.uinfo["None"].teamsize = teamModel.teamsize;
            TeamList.uinfo["None"].type = teamModel.type;
            TeamList.uinfo["None"].desc = teamModel.desc; 
        }
    }

    function getTeamName(teamID)
    {
        var teamName = teamModel.teamName;
        if(TeamList.uinfo[teamID] && TeamList.uinfo[teamID].teamName)
            teamName = TeamList.uinfo[teamID].teamName;
        return teamName;
    }

    function addTeamInfo(teamData) 
    {
        var id = teamData.teamId;
        if (id==teamModel.teamId) return;

        if(TeamList.uinfo && TeamList.uinfo[id])
        { //Team already in list, update
            if(teamData.teamName != teamModel.teamName) TeamList.uinfo[id].teamName = teamData.teamName;
            if(teamData.teamsize != teamModel.teamsize) TeamList.uinfo[id].teamsize = teamData.teamsize;
            if(teamData.type != teamModel.type) TeamList.uinfo[id].type = teamData.type;
            if(teamData.desc != teamModel.desc) TeamList.uinfo[id].desc = teamData.desc;      
        } else
        {
            TeamList.uinfo[id] =  teamData;
        }
    }

    function makeTeamTable()
    {
        TeamList.table = Object.keys(TeamList.uinfo);
    }

/*************************************** player MANAGEMENT ***************************************/
var playerList = [];
playerList.uinfo = [];
playerList.table = []; 
playerList.ts = 0; 

const playerModel = {
    playerId : "",
    displayName : "",
    genderType : "-",
    country : "-",
    city : "-",
    teamId : teamModel.teamId,
    isFollowed : false
}

async function getPlayerListLocal() {
    var playerListLocal =  await getLocal("PlayerList");
    if (playerListLocal === undefined ) playerListLocal = [];
    playerList.uinfo = playerListLocal;
}
async function createPlayerList() {
    if(!playerList)
    {
        playerList = [];
        playerList.uinfo = [];
        playerList.table = [];
        playerList.ts = 0;
    }
}
async function getPlayerList() {
    await createPlayerList();
    await getPlayerListLocal();
    if((playerList.ts < (Date.now()- 35*60*1000)) || (playerList.uinfo.length==0))
    {
        getPlayerListITYC();
        await saveLocal("PlayerList",playerList.uinfo);
        await saveLocal("PlayerList_ts",playerList.ts); 
    }
    makePlayerTable();
}

var getPlayerInProgress = false;
async function getPlayerListITYC() {
    if(getPlayerInProgress) return playerList;
    new Promise((resolve, reject) => {
        var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFBsYXllckxpc3QucGhw"); 
        
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('loadend', () => {
            getPlayerInProgress = false;
            try {
                if (xhr.status === 200 || xhr.status == 0) {
                    let itycPlayerList = JSON.parse(xhr.responseText);
                    itycPlayerList.forEach(function (player) {
                        if(playerList.uinfo[player.uid]) {
                            if(player.tid != "-") playerList.uinfo[player.uid].teamId = player.tid;
                            playerList.uinfo[player.uid].displayName = player.name;
                        }else
                        { 
                            var playerData = Object.create(playerModel);
                            playerData.playerId = player.uid;
                            playerData.displayName = player.name;
                            if(player.tid != "-") playerData.teamId = player.tid;
                            playerList.uinfo[playerData.playerId] = playerData;
                        }   
                    });
                    resolve(true);
                } else {    
                    resolve(false);
                }
            } catch  {
                resolve(false);
            }
        });
        getPlayerInProgress = true;
        xhr.open("GET", getUrl);
        xhr.send();

    });
    return playerList;
}

async function savePlayerList() {
    await saveLocal("PlayerList",playerList.uinfo);
}

function addPlayerInfo(playerData) 
{

    var id = playerData.playerId;
    if (id==playerModel.playerId) return;
    if(playerList.uinfo && playerList.uinfo[id])
    { //Team already in list, update
        if(playerData.displayName != playerModel.displayName) playerList.uinfo[id].displayName = playerData.displayName;
        if(playerData.genderType !=playerModel.genderType) playerList.uinfo[id].genderType = playerData.genderType;
        if(playerData.country != playerModel.country) playerList.uinfo[id].country = playerData.country;      
        if(playerData.teamId != playerModel.teamId) playerList.uinfo[id].teamId = playerData.teamId;     
        if(playerData.city != playerModel.city) playerList.uinfo[id].city = playerData.city;    
		if(playerData.isFollowed != playerModel.isFollowed) playerList.uinfo[id].isFollowed = playerData.isFollowed;     
    } else
    {
        playerList.uinfo[id] =  playerData;
    }
}

function makePlayerTable()
{
    playerList.table = Object.keys(playerList.uinfo);
}

function getPlayerInfos(playerID)
{
    return playerList.uinfo[playerID];
}


/*************************************** RACE information ***************************************/




const raceInfosModel = { 
    legId : "",
    legName : "-",
    name : "-",
    nbPlayers : "",
    priceLevel : "",
    vsrRank : "",
    raceType : "",
    endDate : "",
    startDate : "",
    polar_id : 255
}

var raceList = [];
raceList.uinfo = [];
raceList.table = []; 
raceList.ts = 0; 

async function getRaceListLocal() {
    var raceListLocal =  await getLocal("RaceList");
    if (raceListLocal === undefined ) raceListLocal = [];
    raceList.uinfo = raceListLocal;
}


async function createRaceList() {
    if(!raceList)
    {
        raceList = [];
        raceList.uinfo = [];
        raceList.table = [];
        raceList.ts = 0;
    }
}
async function getRaceList() {
    await createRaceList();
    await getRaceListLocal();
    if((raceList.ts < (Date.now()- 37*60*1000)) || (raceList.uinfo.length==0))
    {
        getRaceListITYC();
        await saveLocal("RaceList",raceList.uinfo);
        await saveLocal("RaceList_ts",raceList.ts); 
    }
    makeRaceTable();
}

var getRaceListInProgress = false;
async function getRaceListITYC() {
    if(getRaceListInProgress) return playerList;
    new Promise((resolve, reject) => {
        var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFJhY2VMaXN0LnBocA==");        
        const xhr = new XMLHttpRequest();        
        xhr.addEventListener('loadend', () => {
            getRaceListInProgress = false;
            try {
                if (xhr.status === 200 || xhr.status == 0) {
                        let itycRaceList = JSON.parse(xhr.responseText);
                        itycRaceList.forEach(function (race) {
                            if(raceList.uinfo[race.rid]) { 
                                if(race.rid != "-")         raceList.uinfo[race.rid].legId =   race.rid;
                                if(race.legName != "-")     raceList.uinfo[race.rid].legName =  race.legName;
                                if(race.name != "-")        raceList.uinfo[race.rid].name =     race.name;
                                if(race.vsrRank != "")      raceList.uinfo[race.rid].vsrRank =  race.vsrRank;
                                if(race.endDate != "")      raceList.uinfo[race.rid].endDate =  race.endDate;
                                if(race.startDate != "")    raceList.uinfo[race.rid].startDate = race.startDate;
                                if(race.type != "")         raceList.uinfo[race.rid].raceType = race.type;
                                if(race.polar_id != "")     raceList.uinfo[race.rid].polar_id = race.polar_id;
                                
                            } else
                            { 
                                var raceData = Object.create(raceInfosModel);
                                raceData.legId = race.rid;
                                raceData.legName = race.legName;
                                raceData.name = race.name;
                                raceData.vsrRank = race.vsr;
                                raceData.endDate = race.end;
                                raceData.startDate = race.start;  
                                raceData.raceType = race.type;  
                                raceData.polar_id = race.polar_id;  
                                raceList.uinfo[raceData.legId] = [];
                                raceList.uinfo[raceData.legId] = raceData;
                            }   
                        });
                    resolve(true);
                } else {    
                    resolve(false);
                }
            } catch {
                resolve(false);                
            }
        });
        getRaceListInProgress = true;
        xhr.open("GET", getUrl);
        xhr.send();
    });
    return raceList;
}

async function saveRaceList() {

    function sendInfoRace(racelist) {
        var webdata = "";
        Object.keys(racelist).forEach(function (key) {
            webdata += "/**/"+JSON.stringify(racelist[key]);
        });
        let dat = JSON.stringify(webdata);
    
        let xhr = new XMLHttpRequest();
        xhr.open("POST", atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblJhY2UyLnBocA==")); 
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(dat);
        
    }
    await saveLocal("RaceList",raceList.uinfo);

    sendInfoRace(raceList.uinfo);

}
function addRaceInfo(raceData) 
{
    var id = raceData.legId.replace(".","_");
    if (id==raceInfosModel.legId) return;
    if(raceList.uinfo && raceList.uinfo[id])
    { //Team already in list, update
        if(raceData.legName != raceInfosModel.legName) raceList.uinfo[id].legName = raceData.legName;
        if(raceData.name != raceInfosModel.name) raceList.uinfo[id].name = raceData.name;
        if(raceData.nbPlayers != raceInfosModel.nbPlayers) raceList.uinfo[id].nbPlayers = raceData.nbPlayers;
        if(raceData.priceLevel != raceInfosModel.priceLevel) raceList.uinfo[id].priceLevel = raceData.priceLevel;
        if(raceData.vsrRank != raceInfosModel.vsrRank) raceList.uinfo[id].vsrRank = raceData.vsrRank;     
        if(raceData.raceType != raceInfosModel.raceType) raceList.uinfo[id].raceType = raceData.raceType;
        if(raceData.endDate != raceInfosModel.endDate) raceList.uinfo[id].endDate = raceData.endDate;   
        if(raceData.startDate != raceInfosModel.startDate) raceList.uinfo[id].startDate = raceData.startDate; 
        if(raceData.polar_id != raceInfosModel.polar_id) raceList.uinfo[id].polar_id = raceData.polar_id; 
        
    } else
    {
        raceList.uinfo[id] =  raceData;
    }
}
function makeRaceTable()
{
    raceList.table = Object.keys(raceList.uinfo);
}

function getRaceInfos(raceID)
{
    return raceList.uinfo[raceID];
}

function getRaceListInfos()
{
    return raceList;
}
/* Full local race saving in order to manage correctly indirect reconnecxion without first boat message */
const toPromise = (callback) => {
    const promise = new Promise((resolve, reject) => {
        try {
            callback(resolve, reject);
        }
        catch (err) {
            reject(err);
        }
    });
    return promise;
}
const saveLocal = (k,v) => {
    const key = k;
    const value = { val: v };

    return toPromise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError);

            resolve(value);
        });
    });
}

const getLocal = (k) => {
    const key = k;

    return toPromise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError);

            const researches = result[key]?((result[key].val!==undefined)?result[key].val:undefined):undefined ;
            resolve(researches);
        });
    });
}
const clearLocal = (k) => {
    const key = k;

    return toPromise((resolve, reject) => {
        chrome.storage.local.remove([key], (result) => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError);
            resolve(true);
        });
    });
}

async function saveLegInfo(races) {
    
    var rList = await getLocal("activeRacelist");
    if (rList === undefined) {
        rList = [];
    }
    races.forEach(async function(race) {
        if(race.legdata) {
            if(rList.indexOf(race.id)<0) {
                rList.push(race.id)
            }
            //save datas
            await saveLocal("race_"+race.id,race.legdata);
            await saveLocal("race_"+race.id+"ts",Date.now());    
        }
    }); 

    /*clear data after 24h*/
    rList.forEach(async function(rid) {
        var saveTs = await getLocal("race_"+rid+"ts",Date.now());
        if(saveTs + (24*3600000) < Date.now()) {
            await clearLocal("race_"+rid);
            await clearLocal("race_"+rid+"ts");
            rList.find((value, index) => {
                if (value === rid) {
                  delete rList[index];
                }
            });
        }
    });
    await saveLocal("activeRacelist",rList);


    raceOptionsList.knowRaceOpt.forEach(async function(idx) {
        let raceExist = false;
        let rid = raceOptionsList.knowRaceOpt[idx];
        if(rid)
        {
            rList.find((value, index) => {
                if (value === rid) {
                  raceExist = true;
                }    
            });
            if(raceExist == false) {
                delete raceOptionsList.race[rid];
                raceOptionsList.knowRaceOpt.find((value, index) => {
                    if (value === rid) {
                      delete raceOptionsList.knowRaceOpt[index];
                    }
                });
    
                await clearLocal("RPO_"+rid);
                await clearLocal("RPO_"+rid+"ts"); 
                await saveLocal("RPOList",raceOptionsList.knowRaceOpt);    
            }
        }
        
    });
}

async function getLegInfo(race) {
    return await getLocal("race_"+race.id);
}


var itycPolarHash = [];
var lastPolarHashUpdate = 0;

var getPolarHashInProgress = false;

async function getItycPolarHash() {
    if(getPolarHashInProgress) return itycPolarHash;

    var saveTs = await getLocal("PolarHashTs",Date.now());
    if(saveTs + (40*3600000) < Date.now()) {
        await clearLocal("PolarHashTs");

        new Promise((resolve, reject) => {
            var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFBvbGFyc0hhc2gucGhw");
            
            const xhr = new XMLHttpRequest();
            
            xhr.addEventListener('loadend', async () => {
                getPolarHashInProgress = false;
                try {
                    if (xhr.status === 200 || xhr.status == 0) {
                        let itycpolarHashList = JSON.parse(xhr.responseText);
                        itycpolarHashList.forEach(function (polar) {
                            if(itycPolarHash[polar.polar_id]) { 
                                if(polar.hash != "") itycPolarHash[polar.polar_id].hash = polar.hash;
                            } else
                            { 
                                itycPolarHash[polar.polar_id] = [];
                                itycPolarHash[polar.polar_id].polar_id = polar.polar_id;
                                itycPolarHash[polar.polar_id].hash = polar.hash;
                            }   
                        });
                        await saveLocal("PolarHash",itycPolarHash);
                        lastPolarHashUpdate = Date.now();    
                        resolve(true);
                    } else {    
                        resolve(false);
                    }
                } catch {
                    resolve(false);                
                }
            });
            getPolarHashInProgress = true;
            xhr.open("GET", getUrl);
            xhr.send();
        });
    }
    return itycPolarHash;
}
function isHashOK(polar_id,hash) 
{
    let ret = false;
    itycPolarHash.forEach(function (pol) {
        if(pol.polar_id == polar_id) 
        {
            if(pol.hash == hash) {
                ret = true;
            }
        }
    });
    return ret;
    
}
function sendPolar2ITYC(polar_id,hash,polarDatas) {

        var webdata = "";
        webdata += JSON.stringify(polar_id)+'|/|';
        webdata += JSON.stringify(hash)+'|/|';
        webdata += JSON.stringify(polarDatas);

        let dat = JSON.stringify(webdata);
    
        let xhr = new XMLHttpRequest();
      
        xhr.open("POST",  atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblBvbGFyLnBocA==")); 
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(dat);
        
}

function serialize (obj) {
    if (Array.isArray(obj)) {
      return JSON.stringify(obj.map(i => serialize(i)))
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj)
        .sort()
        .map(k => `${k}:${serialize(obj[k])}`)
        .join('|')
    }
  
    return obj
  }
  const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };
  




/*************************************** Race payer Option ***************************************/

const raceOptionPlayerModel = { 
    playerId : "",
    time : "-",
    options : "",
    startRaceTime :"-"             //For record
};


var raceOptionsList = [];
raceOptionsList.race = [];
raceOptionsList.ts = [];
raceOptionsList.knowRaceOpt = [];
raceOptionsList.knowRaceOptLoaded = false;

var getRaceOptInProgress = false;

async function loadRPOList()
{
    if(!raceOptionsList.knowRaceOptLoaded) {
        raceOptionsList.knowRaceOpt =  await getLocal("RPOList");  
        raceOptionsList.knowRaceOptLoaded = true;
    }
}

async function createRaceOptionPartition(rid)
{
    await loadRPOList();
    if (raceOptionsList.knowRaceOpt === undefined ) raceOptionsList.knowRaceOpt = [];
    if(!raceOptionsList.race[rid]) {
        raceOptionsList.race[rid] = [];
        raceOptionsList.race[rid].legId = rid;
        raceOptionsList.race[rid].uinfo = [];
        raceOptionsList.race[rid].ts = 0;
        raceOptionsList.knowRaceOpt.push(rid);
        await saveLocal("RPOList",raceOptionsList.knowRaceOpt);
    } 
}

async function getRaceOptionsListLocal(rid)
{
    var RPOLocal =  await getLocal("RPO_"+rid);
    if(RPOLocal) {
        RPOLocal.forEach(function (raceOptPlayer) {
            mergeRaceOptionsList(rid,raceOptPlayer);
        });
    }
}

async function getRaceOptionsListITYC(rid)
{
    if(getRaceOptInProgress) return raceOptionsList;
    new Promise((resolve, reject) => {
        var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldE9wdGlvbkxpc3QucGhwP3JpZD0=")+rid ;
        
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('loadend',async  () => {
            
            getRaceOptInProgress = false;
            try {

                if (xhr.status === 200 || xhr.status == 0) {

                    raceOptionsList.race[rid].ts =  Date.now();
                    let itycRaceOptList = JSON.parse(xhr.responseText);
                    itycRaceOptList.forEach(function (raceOptPlayer) {
                        mergeRaceOptionsList(rid,raceOptPlayer);
                    });

                    resolve(true);
                } else {    
                    resolve(false);
                }
            } catch {
                resolve(false);
            }
        });
      
        getRaceOptInProgress = true;
        xhr.open("GET", getUrl);
        xhr.send();
    });
}


async function getRaceOptionsList(rid,f) {
    if(!rid) return;
    await createRaceOptionPartition(rid);
    await getRaceOptionsListLocal(rid);

    if((raceOptionsList.race[rid].ts < (Date.now()- 30*60*1000)) || f)
    {
        getRaceOptionsListITYC(rid);
        await saveLocal("RPO_"+rid,raceOptionsList.race[rid].uinfo);
        await saveLocal("RPO_"+rid+"ts",raceOptionsList.race[rid].ts); 
    }

}

function mergeRaceOptionsList(rid,raceOptPlayer) {
    var playerOption;

    if(raceOptPlayer.opt=="FP") raceOptPlayer.opt = "Full Pack";
    else if(raceOptPlayer.opt=="AO") raceOptPlayer.opt = "All Options";
    else {
        raceOptPlayer.opt = raceOptPlayer.opt.replace("h","hull");
        raceOptPlayer.opt = raceOptPlayer.opt.replace("H","heavy");
        raceOptPlayer.opt = raceOptPlayer.opt.replace("L","light");
        raceOptPlayer.opt = raceOptPlayer.opt.replace("R","reach");
        raceOptPlayer.opt = raceOptPlayer.opt.replace("W","winch");
        raceOptPlayer.opt = raceOptPlayer.opt.replace("F","foil");
    }
    if(raceOptionsList.race[rid].uinfo[rid])
    {
        playerOption = raceOptionsList.race[rid].uinfo[playerOption.playerId];
        if(raceOptPlayer.update > playerOption.time)
        {
            playerOption.options = raceOptPlayer.opt;
            if(raceOptPlayer.stTs == 0 || raceOptPlayer.stTs =="0" ||  raceOptPlayer.stTs =="-") playerOption.startRaceTime = "-";
            else {
                playerOption.startRaceTime = Number(raceOptPlayer.stTs);                            
            } 
        }
    } else
    {
        playerOption = Object.create(raceOptionPlayerModel);
        playerOption.playerId = raceOptPlayer.uid;
        playerOption.time = raceOptPlayer.update;
        playerOption.options = raceOptPlayer.opt;
        if(raceOptPlayer.stTs == 0 || raceOptPlayer.stTs =="0" ||  raceOptPlayer.stTs =="-") playerOption.startRaceTime = "-";
        else {
            playerOption.startRaceTime = Number(raceOptPlayer.stTs);                            
        }
    }
    raceOptionsList.race[rid].uinfo[playerOption.playerId] = playerOption;

}


async function saveRaceOptionsList(rid) {
    await saveLocal("RPO_"+rid,raceOptionsList.race[rid].uinfo); 
}

async function addRaceOptionsList(raceId,raceOptionPlayer)
{
    if (raceId=="") return;

    await createRaceOptionPartition(raceId);

    if(raceOptionPlayer.playerId && raceOptionPlayer.playerId != raceOptionPlayerModel.playerId)
    {//
        if(raceOptionsList.race[raceId].uinfo[raceOptionPlayer.playerId])
        {
            if(raceOptionPlayer.time != raceOptionPlayerModel.time) raceOptionsList.race[raceId].uinfo[raceOptionPlayer.playerId].time = raceOptionPlayer.time;
            if(raceOptionPlayer.options != raceOptionPlayerModel.options) raceOptionsList.race[raceId].uinfo[raceOptionPlayer.playerId].options = raceOptionPlayer.options;
            if(raceOptionPlayer.startRaceTime != raceOptionPlayerModel.startRaceTime) raceOptionsList.race[raceId].uinfo[raceOptionPlayer.playerId].startRaceTime = raceOptionPlayer.startRaceTime;
        } else
        {
            raceOptionsList.race[raceId].uinfo[raceOptionPlayer.playerId] = raceOptionPlayer;   
        }
    } 
}

function getRaceOptions(raceId)
{
    if(raceOptionsList.race[raceId])
    {
        return raceOptionsList.race[raceId].uinfo;
    }
}
function getRaceOptionsPlayer(raceId, playerId)
{
    var options = "-";
    if(raceOptionsList.race[raceId])
    {
        if(raceOptionsList.race[raceId].uinfo)
            if(raceOptionsList.race[raceId].uinfo[playerId])
                options = raceOptionsList.race[raceId].uinfo[playerId].options ;
    } 
    return options;
}
function getStartRaceTimePlayer(raceId, playerId)
{
    var startRaceTime = "-";
    if(raceOptionsList.race[raceId])
    {
        if(raceOptionsList.race[raceId].uinfo)
            if(raceOptionsList.race[raceId].uinfo[playerId])
                startRaceTime = raceOptionsList.race[raceId].uinfo[playerId].startRaceTime ;
    } 
    return startRaceTime;
}

function getRacePlayerInfos(raceId, playerId)
{
    var playerInfos = Object.create(raceOptionPlayerModel);
    if(raceOptionsList.race[raceId])
    {
        if(raceOptionsList.race[raceId].uinfo)
            if(raceOptionsList.race[raceId].uinfo[playerId])
            playerInfos = raceOptionsList.race[raceId].uinfo[playerId];
    } 
    return playerInfos;
}




/*************************************** EXPORT ***************************************/
 
    export {
        TeamList,teamModel,
        getTeamList,saveTeamList,addTeamInfo,makeTeamTable,
        getTeamInfos,getTeamName,createEmptyTeam,
        playerList,playerModel,
        getPlayerList,savePlayerList,addPlayerInfo,makePlayerTable,
        getPlayerInfos,
        raceInfosModel,raceList,
        getRaceList,saveRaceList,addRaceInfo,makeRaceTable,getRaceListInfos,
        getRaceInfos,
        raceOptionPlayerModel,raceOptionsList,
        getRaceOptionsList,saveRaceOptionsList,addRaceOptionsList,
        getRaceOptions,getRaceOptionsPlayer,getStartRaceTimePlayer,getRacePlayerInfos,
        saveLegInfo,getLegInfo,
        serialize,cyrb53,getItycPolarHash,isHashOK,sendPolar2ITYC



    };