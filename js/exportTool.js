
import * as Util from './util.js';
import * as DM from './dataManagement.js';

export function onFleetInCpyClipBoard(fleet,currentUserId,race)
{
    function formatDate (ts,
        dflt,
        tsOptions = {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
            timeZoneName: "short"
        })
    {
        if (!ts && dflt) return dflt;
        // Do not invent a timestamp here.
        if (!ts) {
            return "undefined";
        }
        // Use UTC if local time is not requested
        if (!document.getElementById("local_time").checked) {
            tsOptions.timeZone = "UTC";
        }
        var d = new Date(ts);
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }

    function formatDateShort (ts, dflt) {
        var tsOptions = {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
            timeZoneName: "short"
        };
        return formatDate(ts, dflt, tsOptions);
    }

    function boatinfoExport(uid, uinfo) {
        return {
            name: uinfo.displayName,
            speed: uinfo.speed,
            heading: uinfo.heading,
            tws: uinfo.tws,
            twa: Math.abs(uinfo.twa),
            sail: sailNamesExport[uinfo.sail] || "-",
        };
    }

    function formatDHMSFull(ts) {
        ts = Math.floor(ts / 1000);
        var days = Math.floor(ts / 86400);
        var hours = Math.floor(ts / 3600) % 24;
        var minutes = Math.floor(ts / 60) % 60;
        var seconds = ts - days * 86400 - hours *3600 - minutes*60;
        return pad0(days) + "d " + pad0(hours) + "h " + pad0(minutes) + "m " +  pad0(seconds) + "s";
    }

    function pad0 (val, length=2, base=10) {
        var result = val.toString(base)
        while (result.length < length) result = '0' + result;
        return result;
    }

    if (fleet === undefined || fleet.table.length==0) return;
    let  contextClip = "RT"+'\t'
            +      "Skipper"+'\t';
    if (race.type === "record") {
        contextClip += "Start Date"+'\t';
        contextClip += "ERT"+'\t';
        contextClip += "avgS"+'\t';
    }

    contextClip += "Last Update"+'\t'
            +      "Rank"+'\t';
    if (race.type !== "record") 
        contextClip += "RaceTime"+'\t';
    contextClip += "DTF"+'\t'
            +      "DTU"+'\t'
            +      "BRG"+'\t'
            +      "Sail"+'\t'
            +      "State"+'\t'
            +      "Position"+'\t'
            +      "HDG"+'\t'
            +      "TWA"+'\t'
            +      "TWS"+'\t'
            +      "Speed"+'\t'
            +      "Stamina"+'\t'
            +      "Factor"+'\t'
            +      "Foils"+'\t'
            +      "Options"+"\r\n";

    
    const sailNamesExport = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
    // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
    "Auto", "Jib (Auto)", "Spi (Auto)", "Stay (Auto)", "LJ (Auto)", "C0 (Auto)", "HG (Auto)", "LG (Auto)"];

    function isDisplayEnabled (record, uid) {
        return  (uid == currentUserId)
            || (record.type2 == "followed" && document.getElementById("sel_friends").checked)
            || (record.type2 == "team" && document.getElementById("sel_team").checked)
            || (record.type2 == "normal" && document.getElementById("sel_opponents").checked)
            || ((record.type == "top" || record.type2 == "top") && document.getElementById("sel_top").checked)
            || (record.type2 == "certified" && document.getElementById("sel_certified").checked)
            || (record.type2 == "real" && document.getElementById("sel_reals").checked)
            || ((record.type == "sponsor" || record.type2 == "sponsor") && document.getElementById("sel_sponsors").checked)
            || (record.choice == true && document.getElementById("sel_selected").checked)
            || (record.state == "racing" && document.getElementById("sel_inrace").checked);
    }
    Object.keys(fleet.table).forEach(function (tid) {
        let uid = fleet.table[tid];
        let pLine ="";
        
        if (uid !== undefined) {
            var p = fleet.uinfo[uid];
            if (p == undefined || race.legdata == undefined) return;
            if(!isDisplayEnabled(p,uid)) return;
            var bi = boatinfoExport(uid, p);

            pLine = "*" +'\t';
            pLine += bi.name +'\t';

            if (race.type === "record") {
                if (p.state === "racing" && p.distanceToEnd) {
                    try {
                        var raceTime = (p.tsRecord - p.startDate);
                        var estimatedSpeed = p.distanceFromStart / (raceTime / 3600000);
                        var eTtF = (p.distanceToEnd / estimatedSpeed) * 3600000;
                        var eRT = raceTime + eTtF;
                        p.avgSpeed = estimatedSpeed;
                        p.eRT = eRT;
                    } catch (e) {
                        p.eRT = e.toString();
                    }
                    pLine += formatDate(p.startDate, 'UserCard missing') +'\t'
                        +   Util.formatDHMS(p.eRT) +'\t'
                        +   Util.roundTo(p.avgSpeed, 2) +'\t';
                } else {

                    pLine += 'UserCard missing' +'\t' +'\t' +'\t';
                }
            }
            pLine +=  formatDateShort(p.lastCalcDate) +'\t';
            pLine +=  (p.rank ? p.rank : "-")  +'\t';
            if (race.type !== "record") {
                let rtime = "";
                if(p.raceTime != undefined && p.raceTime != 0)
                    rtime = formatDHMSFull(p.raceTime);

                pLine += rtime +'\t';
                 
            }
            pLine += ((p.dtf==p.dtfC) ?"(" + Util.roundTo(p.dtfC, 1) + ")":Util.roundTo(p.dtf, 1) )  +'\t';
            pLine += (p.distanceToUs ? p.distanceToUs : "-")  +'\t';
            pLine += (p.bearingFromUs ? p.bearingFromUs  : "-")  +'\t';
            pLine += bi.sail  +'\t';
            pLine += (p.state || "-")  +'\t';
            pLine += (p.pos ? Util.formatPosition(p.pos.lat, p.pos.lon) : "-")  +'\t';
            pLine += Util.roundTo(bi.heading, 3)  +'\t';
            pLine += Util.roundTo(bi.twa, 3)  +'\t';
            pLine += Util.roundTo(bi.tws, 1)  +'\t';
            pLine += Util.roundTo(bi.speed, 2)  +'\t';
            pLine += (p.stamina ? p.stamina.toFixed() : '-')  +'\t';
            pLine += Util.roundTo(p.xfactor, 4)  +'\t';
            pLine += (p.xoption_foils || "?")  +'\t';
            pLine += (p.xoption_options || "?") ;
            pLine += "\r\n";
            
        } else pLine ="";
        contextClip += pLine;
    });

    navigator.clipboard.writeText(contextClip);
    
    let sailRanksRaceid = document.getElementById("sailRankRaceId").value;

    if(sailRanksRaceid != "" && sailRanksRaceid!=0) {
        let baseUrl = " https://sailranks.com/v/regattas/";
        let fullUrl = " https://sailranks.com/v/regattas/" + sailRanksRaceid;
        Util.openTab(fullUrl,  baseUrl,document.getElementById("reuse_tab").checked);
    }

}
export function exportPolar(polars)
{
    {
        Object.keys(polars).forEach(function (id) {
            var boatName = polars[id].label.split('/')[1]?polars[id].label.split('/')[1]:polars[id].label;
            boatName = boatName.replace('-','_');
            var ExportedData ="data_"+ boatName +" = '[";
            ExportedData += JSON.stringify(polars[id]);
            ExportedData += "]'"
            var boatName = polars[id].label.split('/')[1]?polars[id].label.split('/')[1]:polars[id].label;
            let blobData = new Blob([ExportedData], {type: "text/plain"});
            let url = window.URL.createObjectURL(blobData);
            saveFile(boatName+'.json',url);
        });


    }

}



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
}
export function exportGraphData(race,csvSep)
{
    function printDate(tps) {
        var a = new Date(Number(tps));
        var year = a.getFullYear();
        var month = a.getMonth();
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
    
        if(hour<10) hour = "0"+hour;
        if(min<10) min = "0"+min;
        if(sec<10) sec = "0"+sec;
        
        var pDate = date + '/' + month + '/' + year + ' ' + hour + 'h' + min;
        if(sec!=0) pDate += ':' + sec ;
        return pDate;
    }

    var fileContent = "Race data\n";
    fileContent += "Date;"+printDate(Date.now()) +" \n";

   
    if(race && race.recordedData) {
        let rid = race.id; 
        let recordedInfos = race.recordedData;
        var raceDatas = DM.getRaceInfos(rid);
        var raceName = raceDatas.legName?raceDatas.legName:raceDatas.name;

        fileContent += "RaceID"+csvSep+rid; 
        fileContent += "\n";
        fileContent += "Race Name"+csvSep + raceName.remExportAcc(); 
        fileContent += "\n\n";
        fileContent += "Time"+csvSep+"TWS"+csvSep+"TWD"+csvSep+"TWA"+csvSep+"HDG"+csvSep+"Speed"+csvSep+"Stamina"+csvSep+"Sail\n";
       
        for(var i=0;i<recordedInfos.ts.length;i++) {
            fileContent += printDate(recordedInfos.ts[i])+csvSep;

            var data = recordedInfos.tws[i]?((recordedInfos.tws[i] +csvSep)):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.twd[i]?((recordedInfos.twd[i] +csvSep).replace(".",",")):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.twa[i]?((recordedInfos.twa[i] +csvSep).replace(".",",")):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.hdg[i]?((recordedInfos.hdg[i] +csvSep).replace(".",",")):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.bs[i]?((recordedInfos.bs[i] +csvSep).replace(".",",")):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.stamina[i]?((recordedInfos.stamina[i] +csvSep).replace(".",",")):csvSep;
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
            data = recordedInfos.sail.id[i]?(sailNames[recordedInfos.sail.id[i]].split(" ")[0] +csvSep+"\n"):csvSep+"\n";
            if(csvSep!=',') data.replace(".",",");
            fileContent += data;
        }

        
        let blobData = new Blob([fileContent], {type: "text/plain"});
        let url = window.URL.createObjectURL(blobData);
        let fileName = "graphData_";
        fileName += rid;
        fileName += ".csv";
        saveFile(fileName,url);
    }
}

export function exportStamina(paramStamina)
{

    if(!paramStamina || !paramStamina.consumption) return;
  //  if(format="json")
  var ExportedData = "stamina = ";
  ExportedData += JSON.stringify(paramStamina);
  let blobData = new Blob([ExportedData], {type: "text/plain"});
  let url = window.URL.createObjectURL(blobData);
  saveFile('stamina.json',url);  
}

if (!String.prototype.format) {
    String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
    };
}

export function exportRestrictedZones()
{
    function coordPrinter(lat,lon)
    {
        return "["+Util.roundTo(lat, 5)+" , "+ Util.roundTo(lon, 5)+"]";
    }

    let fileContent =
'{\r\n\
"type": "FeatureCollection",\r\n\
"features": [\r\n';

    var race = races.get(selRace.value);
    if(race && race.legdata && race.legdata.restrictedZones && race.legdata.restrictedZones.length) {
        let featureHeader =
'    {\r\n\
 "type": "Feature",\r\n';
        let featureSep =
'     "properties": {},\r\n\
 "geometry": {\r\n\
   "type": "Polygon",\r\n\
   "coordinates": [\r\n\
      [\r\n';
        let featureEnd = 
'          ]\r\n\
    ]\r\n\
  }\r\n\
}';
        let firstZone = true;
        race.legdata.restrictedZones.forEach(restrictedZone => {
            let bbox = restrictedZone.bbox;
            if(!firstZone)
                fileContent += ",\r\n";
            firstZone = false;
            fileContent += featureHeader;
            fileContent += '     "bbox": [' + bbox[0] +',' + bbox[1] +',' + bbox[2] +',' + bbox[3] +'],\r\n';
            fileContent += featureSep;

            let firstPt = restrictedZone.vertices[0];
            restrictedZone.vertices.forEach(zone => {
                fileContent += '           ' + coordPrinter(zone.lat,zone.lon)+",\r\n";
            });
            fileContent += '           ' + coordPrinter(firstPt.lat,firstPt.lon)+"\r\n";
            fileContent += featureEnd ;
        });
        fileContent +=  
'\r\n  ]\r\n\
}';
        let blobData = new Blob([fileContent], {type: "text/plain"});
        let url = window.URL.createObjectURL(blobData);
        let fileName = "restrictedZones_race_"+race.legdata._id.race_id+"_"+race.legdata._id.num;
        saveFile(fileName,url);
    }   
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
