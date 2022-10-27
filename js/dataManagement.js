

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

    function saveTeamList() {

//no local saving , done fleet send on ityc side
    }

    var getTeamInProgress = false;
    async function getTeamList() {
        if(getTeamInProgress) return TeamList;
        new Promise((resolve, reject) => {
            var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFRlYW1MaXN0LnBocA=="); 
            
            const xhr = new XMLHttpRequest();
            
            xhr.addEventListener('loadend', () => {
                
                getTeamInProgress = false;
                try {
                    if (xhr.status === 200 || xhr.status == 0) {
                        TeamList.uinfo = [];
                        TeamList.table = []; 
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
                        saveTeamList();
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

const playerModel = {
    playerId : "",
    displayName : "",
    genderType : "-",
    country : "-",
    city : "-",
    teamId : teamModel.teamId,
    isVIP : "?",
    isFollowed : false
}


var getPlayerInProgress = false;
async function getPlayerList() {
    if(getPlayerInProgress) return playerList;
    new Promise((resolve, reject) => {
        var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFBsYXllckxpc3QucGhw"); 
        
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('loadend', () => {
            getPlayerInProgress = false;
            try {
                if (xhr.status === 200 || xhr.status == 0) {
                    playerList.uinfo = [];
                    playerList.table = []; 
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
                            playerData.displayName = player.name;
                            playerList.uinfo[playerData.playerId] = playerData;
                        }   
                    });
                    //savePlayerList();
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

function savePlayerList() {

//no local saving , done fleet send on ityc side

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
        if(playerData.isVIP != playerModel.isVIP) playerList.uinfo[id].isVIP = playerData.isVIP;
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
    type : ""
}

var raceList = [];
raceList.uinfo = [];
raceList.table = []; 

var getRaceListInProgress = false;
async function getRaceList() {
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
                                if(race.rid != "-")         raceList.uinfo[race.rid].teamId =   race.rid;
                                if(race.legName != "-")     raceList.uinfo[race.rid].legName =  race.legName;
                                if(race.name != "-")        raceList.uinfo[race.rid].name =     race.name;
                                if(race.vsrRank != "")     raceList.uinfo[race.rid].vsrRank =  race.vsrRank;
                                if(race.endDate != "")     raceList.uinfo[race.rid].endDate =  race.endDate;
                                if(race.startDate != "")   raceList.uinfo[race.rid].startDate = race.startDate;
                                if(race.type != "")         raceList.uinfo[race.rid].type = race.type;
                                
                            } else
                            { 
                                var raceData = Object.create(raceInfosModel);
                                raceData.legId = race.rid;
                                raceData.legName = race.legName;
                                raceData.name = race.name;
                                raceData.vsrRank = race.vsr;
                                raceData.endDate = race.end;
                                raceData.startDate = race.start;  
                                raceData.type = race.type;  
                                raceList.uinfo[raceData.legId] = [];
                                raceList.uinfo[raceData.legId] = raceData;
                            }   
                        });

                    //savePlayerList();
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

function saveRaceList() {

    function sendInfoRace(racelist) {
        var webdata = "";
        Object.keys(racelist).forEach(function (key) {
            webdata += "/**/"+JSON.stringify(racelist[key]);
        });
        let dat = JSON.stringify(webdata);
    
        let xhr = new XMLHttpRequest();
        xhr.open("POST", atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblJhY2UucGhw")); 
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(dat);
        
    }
    sendInfoRace(raceList.uinfo);

}
function addRaceInfo(raceData) 
{
    var id = raceData.legId;
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
        if(raceData.startDate != raceInfosModel.startDate) raceList.uinfo[id].endDate = raceData.startDate;             
        if(raceData.type != raceInfosModel.type) raceList.uinfo[id].type = raceData.type;             
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


/*************************************** Race payer Option ***************************************/

const raceOptionPlayerModel = { 
    playerId : "",
    time : "-",
    options : "",
    startRaceTime :"-"             //For record
};


var raceOptionsList = [];
raceOptionsList.race = [];

var getRaceOptInProgress = false;
async function getRaceOptionsList(rid) {

    if(getRaceOptInProgress) return raceOptionsList;

    new Promise((resolve, reject) => {
        var getUrl = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldE9wdGlvbkxpc3QucGhwP3JpZD0=")+rid ;
        
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('loadend', () => {
            
            getRaceOptInProgress = false;
            try {

                if (xhr.status === 200 || xhr.status == 0) {
                    raceOptionsList.race[rid] = [];
                    raceOptionsList.race[rid].legId = rid;
                    raceOptionsList.race[rid].uinfo = [];

                    let itycRaceOptList = JSON.parse(xhr.responseText);
                    itycRaceOptList.forEach(function (raceOptPlayer) {
                        var playerOption = Object.create(raceOptionPlayerModel);
                        playerOption.playerId = raceOptPlayer.uid;
                        playerOption.time = raceOptPlayer.update;
                        playerOption.options = raceOptPlayer.opt;
                        playerOption.startRaceTime = raceOptPlayer.stTs;
                        if(playerOption.startRaceTime == 0 || playerOption.startRaceTime =="0") playerOption.startRaceTime = "-";
                        raceOptionsList.race[rid].uinfo[playerOption.playerId] = playerOption;
                    });
                    //savePlayerList();
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

function saveRaceOptionsList() {
//no local saving , done fleet send on ityc side

}

function addRaceOptionsList(raceId,raceOptionPlayer)
{
    if (raceId=="") return;
    if(!raceOptionsList.race[raceId])
    {
        raceOptionsList.race[raceId] = [];
        raceOptionsList.race[raceId].legId = raceId;
        raceOptionsList.race[raceId].uinfo = [];
    }

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
    } else
    {
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
                options = raceOptionsList.race[raceId].uinfo[playerId].options 
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
        getRaceList,saveRaceList,addRaceInfo,makeRaceTable,
        getRaceInfos,
        raceOptionPlayerModel,raceOptionsList,
        getRaceOptionsList,saveRaceOptionsList,addRaceOptionsList,
        getRaceOptions,getRaceOptionsPlayer,getStartRaceTimePlayer,getRacePlayerInfos



    };