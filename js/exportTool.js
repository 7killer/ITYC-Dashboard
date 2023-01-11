
import * as DM from './dataManagement.js';




export function generateFleetCSV(fleet,raceId)
{
    if (rf === undefined || rf.table.length==0) return;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    
    var  date = mm + '_' + dd + '_' + yyyy+ '_' + today.getHours()+today.getMinutes();

    //Player List
    var tabletitle = " ";
    var raceDatas = DM.getRaceInfos(raceId);
    
    if(raceDatas)
    {
        if(raceDatas.vsrRank != DM.raceInfosModel.vsrRank)    
            tabletitle += " - VSR " + raceDatas.vsrRank;
        if(raceDatas.nbPlayers != DM.raceInfosModel.nbPlayers)    
            tabletitle +=  " - " + raceDatas.nbPlayers + " skippers";
        if(raceDatas.priceLevel != DM.raceInfosModel.priceLevel)    
            tabletitle += " - Price Level " + raceDatas.priceLevel;
    }
    var raceName = raceDatas.legName?raceDatas.legName:raceDatas.name;
    var commonTitle = "Ranking after " + raceName.remExportAcc() + tabletitle+" ";

    fileContent = commonTitle + Util.formatDateTable(Date.now()) + "\n";
    fileContent += "World Ranking\n\n"
    fileContent += "RT;Skipper;Last Update;Rank;DTF;DTU;BRG;"
    fileContent += "Sail;State;RaceTime;Position;HDG;TWA;TWS;Speed;Factor;Foils;Options\n";

    fileContent += Array.from(fleet.table || []).map(makeLineToCopy).join("\n");                    
    blobData = new Blob([fileContent], {type: "text/plain"});
    url = window.URL.createObjectURL(blobData);
    saveFile(raceName + '_World_Ranking_'+date+'.csv',url);






    //lastRankUpdate



    function makeLineToCopy(id_data) {

        var r = fleet.uinfo[id_data];
        return "ityc" + ";" 
                            + r.displayName + ";" 
                            + formatTime(r.lastCalcDate) + ";"
                            + r.rank  + ";"
                            + r.dtf + ";"
                            + r.distanceToUs + ";"+ ";"
                            + sailNames[r.sail]  + ";" 
                            + r.state + ";"
                            + ((raceDatas.type !== "record")?(r.raceTime ? Util.formatDHMS(r.raceTime) : "-"):"") + ";"
                            + (r.pos ? Util.formatPosition(r.pos.lat, r.pos.lon) : "-") + ";"
                            + Util.roundTo(r.heading, 3) + ";"
                            + Util.roundTo(r.twa, 3) + ";"
                            + Util.roundTo(r.tws, 3) + ";"
                            + Util.roundTo(r.speed, 3) + ";"
                            + Util.roundTo(r.xfactor, 4) + ";"    
                            +  (r.xoption_foils || "?") + ";"       
                            + (r.xoption_options || "?")  + ";";


    }

   

    
    function saveFile(fileName,urlFile){
        let a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
        a.href = urlFile;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(urlFile);
        a.remove();
    }
   
}