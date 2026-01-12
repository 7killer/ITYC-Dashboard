
import {isDisplayEnabled} from '../app/sortManager.js'

import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos,
        getLegSelectedPlayersState,
        setLegSelectedPlayers
} from '../app/memoData.js'

import { deleteAllRoutes,hideRoute,showRoute,importRoute} from './map/map-routes.js'
import { 
    isBitSet,guessOptionBits,
} from '../../common/utils.js';

import { mapState } from './map/map-race.js';
import {importExternalRouter,importGPXRoute,importExtraPattern} from '../app/route_importer.js'
import {zezoCall} from '../../common/zezoscript.js'

let popupStateLmap =false;
var actualZezoColor = "#AA0000";
var actualAvalon06Color ="#005500";
var actualVRZenColor ="#499300";
var actualgpxColor ="#009349";

function loadRacingSkipperList(elt)
{
    const selectobject = document.getElementById(elt);
    const options = selectobject.getElementsByTagName('OPTION');
    const optionsSelect = selectobject.value;
    let optionsSelectStillExist = false;
    
    for (let i=0; i<options.length; i++) {
        selectobject.removeChild(options[i]);
        i--;
    }

    const raceItesFleet    = getLegFleetInfos();
    const connectedPlayerId = getConnectedPlayerId();

    const fln = Object.fromEntries(
    Object.entries(raceItesFleet)
        .filter(([, p]) => p.state !== "Arrived")
        .sort(([, a], [, b]) =>
        a.info.name.localeCompare(b.info.name, 'fr', { sensitivity: 'base' })
        )
        .map(([userId, p]) => [userId, {
            userId,
            name: p.info.name,
            options: p.options,
            type : p.ite.type,
            type2 : p.ite.type2,
            choice : p.ite.choice,
            state : p.ite.state
        }])
    );
    Object.entries(fln).forEach(([key, value]) => {
    // key   -> la clé
    // value -> la valeur / objet
        if (isDisplayEnabled(value, key,connectedPlayerId)) {
            const option = document.createElement("option");

            let optionK = "";
            if(!value.options || value.options=="?")
                optionK = " (*)";

            option.text = value.name+optionK;
            option.value = value.userId;
            if(key==optionsSelect) optionsSelectStillExist = true;
            document.getElementById(elt).appendChild(option);
        }
    });
    
    if(optionsSelectStillExist) selectobject.value = optionsSelect;
    onSkipperSelectedChange("Lmap");
}

export function onPopupOpenLmap()
{
    const raceInfo = getRaceInfo();
    if(!raceInfo || popupStateLmap) return;

    popupStateLmap = true;
    document.getElementById("rt_popupLmap").style.display = "block";
    document.getElementById("sel_rt_skipperLmap").style.display = "block";
    document.getElementById("rt_nameSkipperLmap").style.display = "none";
    document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
    document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
    document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
    document.getElementById("route_colorLmap").value = actualZezoColor;
    loadRacingSkipperList("sel_rt_skipperLmap");
    onChangeRouteTypeLmap();
}

export function onPopupCloseLmap() {
    popupStateLmap = false;
    document.getElementById("rt_popupLmap").style.display = "none";
}


export function onCleanAllRoute() {
    deleteAllRoutes();
    document.getElementById("route_list_tableLmap").innerHTML = "";
}


export function onChangeRouteTypeLmap() {
    const routeType = document.getElementById("sel_routeTypeLmap").value;
    switch(routeType)
    {
        default :
            return;
        case "rt_Zezo":
            document.getElementById("sel_rt_skipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").style.display = "none";
            document.getElementById("route_colorLmap").value = actualZezoColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
            document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
            document.getElementById("rt_popupLmap").style.height = "9.5em";
            break;
        case "rt_Avalon":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value = actualAvalon06Color;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
        case "rt_VRZen":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value =  actualVRZenColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
        case "rt_gpx":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value =  actualgpxColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
      
    }
}

async function loadExternalFile(rid,type) {
    let tf = '.gpx';
    let routeType = 'Gpx';
    let routeFormat = 3;
    if(type == "rt_Avalon") {
        tf = '.csv';
        routeType = "Avalon ";
        routeFormat = 0;
    } else if(type == "rt_VRZen") {
        tf = '.csv';
        routeType = "VR Zen ";
        routeFormat = 1;
    } else if(type == "rt_gpx") {
        tf = '.gpx';
        routeType = "Gpx ";
        routeFormat = 3;
    } else if(type == "rt_Pattern") {
        tf = '.csv';
    } else if(type == "rt_dorado") {
        tf = '.csv';
        routeType = "Dorado ";
        routeFormat = 4;
    }

    const pickerOpts = {
        types: [
          {
            description: 'Routage',
            accept: {
              'track/*': [tf]
            }
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false
    };
    let fileHandle;
    
    [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const fileH = await fileHandle.getFile();
    const fileData = await fileH.text();
    if(type == "rt_Avalon" || type == "rt_VRZen" || type == "rt_dorado") {
        return importExternalRouter(
            rid,
            fileData,
            routeType,
            document.getElementById("rt_nameSkipperLmap").value,
            document.getElementById("route_colorLmap").value,
            routeFormat);
    } else if(type == "rt_gpx" ) {
        return importGPXRoute(
            rid,
            fileData,
            "Gpx",
            document.getElementById("rt_nameSkipperLmap").value,
            document.getElementById("route_colorLmap").value,
        );   
    } else if(type == "rt_Pattern" ) {
        return importExtraPattern(
            rid,
            fileData,
            "contour",
            document.getElementById("rt_nameSkipperLmap").value,
            document.getElementById("route_colorLmap").value
        );
    }
}

function buildPlayerOption(type)
{
    const pOptions = {
        reach : false,
        light : false,
        heavy : false,
        hull  : false,
        foil  : false,
        winch : false,
        comfortLoungePug : false,
        magicFurler : false,
        vrtexJacket : false
    };
    if(getCheckbox("opt_FP_"+type)) {
        pOptions.reach = true;
        pOptions.light = true;
        pOptions.heavy = true;
        pOptions.hull = true;
        pOptions.foil = true;
        pOptions.winch = true;
        pOptions.comfortLoungePug = true;
        pOptions.magicFurler = true;
        pOptions.vrtexJacket = true;
    } else{
        if(getCheckbox("opt_hgss_"+type))   pOptions.heavy = true;
        if(getCheckbox("opt_ljg_"+type))    pOptions.light = true;
        if(getCheckbox("opt_c0_"+type))     pOptions.reach = true;
        
        if(getCheckbox("opt_foils_"+type))  pOptions.foil = true;
        if(getCheckbox("opt_hull_"+type))   pOptions.hull = true;
        if(getCheckbox("opt_winch_"+type))  pOptions.winch = true;
/*        if(getCheckbox("opt_magicFurler_"+type)) pOptions.magicFurler = true;
        if(getCheckbox("opt_vrtexJacket_"+type)) pOptions.vrtexJacket = true;
        if(getCheckbox("opt_comfortLoungePug_"+type)) pOptions.comfortLoungePug = true;
*/
    }
    return pOptions;
}

export async function onAddRouteLmap() {
    const routeType = document.getElementById("sel_routeTypeLmap").value;
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
    let routeName = "";
   
    switch(routeType)
    {
        default :
            return;
        case "rt_Zezo":
            if (!raceInfo.url) {
            alert("Unknown race - no routing available");
            return;
            }
            const raceItesFleet    = getLegFleetInfos();
            const playerId = document.getElementById("sel_rt_skipperLmap").value;
            if(!raceItesFleet ||!raceItesFleet[playerId]) {
                alert("Unknown player - no routing available");
                return;
            }
            const playerIte = raceItesFleet[playerId];
            playerIte.options = buildPlayerOption("Lmap");    
            const raceUrl = raceInfo.url + (raceInfo.betaflag ? "b" : "");

            document.getElementById("bt_rt_addLmap").innerText = "Loading";
            document.getElementById("bt_rt_addLmap").disabled = true;
            
            zezoCall(rid,playerIte,document.getElementById("route_colorLmap").value,raceUrl);  
            actualZezoColor = '#'+Math.floor(Math.random()*16777216).toString(16).padStart(6, '0');
            document.getElementById("route_colorLmap").value = actualZezoColor;  
            //update map is done in zezo call as its async
            break;

        case "rt_Avalon" :
            routeName = await loadExternalFile(rid,"rt_Avalon");
            break;
        case "rt_VRZen" :
            routeName = await loadExternalFile(rid,"rt_VRZen");
            break; 
        case "rt_gpx" :
            routeName = await loadExternalFile(rid,"rt_gpx");   
            break;          
    }
    if(routeName != "") {
        updateRouteListHTML();
        displayMapTrace(rid,routeName);
    }       
}
function upDateCheckbox(elt,value)
{
    var checkBox = document.getElementById(elt);
    if(checkBox) 
    {
        checkBox.checked = value;
        var event = new Event('change');
        checkBox.dispatchEvent(event);
    }
}
function getCheckbox(elt)
{
    var checkBox = document.getElementById(elt);
    if(checkBox) 
    
        return checkBox.checked;
     else
        return null;
}
export function onSkipperSelectedChange(type)
{
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;

    const raceItesFleet    = getLegFleetInfos();
    const playerId = document.getElementById("sel_rt_skipperLmap").value;
    if(!raceItesFleet ||!raceItesFleet[playerId]) {
        alert("Unknown player - no routing available");
        return;
    }
    upDateCheckbox("opt_c0_"+type,false);   
    upDateCheckbox("opt_ljg_"+type,false);  
    upDateCheckbox("opt_hgss_"+type,false); 
    upDateCheckbox("opt_hull_"+type,false); 
    upDateCheckbox("opt_foils_"+type,false);
    upDateCheckbox("opt_winch_"+type,false);
//    upDateCheckbox("opt_comfortLoungePug_"+type,false);
//    upDateCheckbox("opt_magicFurler_"+type,false);
//    upDateCheckbox("opt_vrtexJacket_"+type,false);
    upDateCheckbox("opt_FP_"+type,false)

    const playerIteOpt = raceItesFleet[playerId]?.options;
    if(playerIteOpt.options) {
        const pOptions = playerIteOpt.options;
        if(pOptions.options.reach) upDateCheckbox("opt_c0_"+type,true); 
        if(pOptions.options.light) upDateCheckbox("opt_ljg_"+type,true); 
        if(pOptions.options.heavy) upDateCheckbox("opt_hgss_"+type,true);
        if(pOptions.options.hull)  upDateCheckbox("opt_hull_"+type,true);
        if(pOptions.options.foil)  upDateCheckbox("opt_foils_"+type,true);
        if(pOptions.options.winch) upDateCheckbox("opt_winch_"+type,true);
//            if(pOptions.comfortLoungePug)  upDateCheckbox("opt_comfortLoungePug_"+type,true);
//            if(pOptions.magicFurler)   upDateCheckbox("opt_magicFurler_"+type,true);
//            if(pOptions.vrtexJacket)   upDateCheckbox("opt_vrtexJacket_"+type,true);
        if(pOptions.options.reach
        && pOptions.options.light
        && pOptions.options.heavy
        && pOptions.options.hull
        && pOptions.options.foil
        && pOptions.options.winch
        && pOptions.options.comfortLoungePug
        && pOptions.options.magicFurler
        && pOptions.options.vrtexJacket) upDateCheckbox("opt_FP_"+type,true); else upDateCheckbox("opt_FP_"+type,false);
    } else if(playerIteOpt.guessOptions  && playerIteOpt.guessOptions!= 0)
    {
        
        const pOptions = playerIteOpt.guessOptions;
        if(isBitSet(pOptions,guessOptionBits["reach"]))  upDateCheckbox("opt_c0_"+type,true);
        if(isBitSet(pOptions,guessOptionBits["light"]))  upDateCheckbox("opt_ljg_"+type,true);
        if(isBitSet(pOptions,guessOptionBits["heavy"]))  upDateCheckbox("opt_hgss_"+type,true);
        if((isBitSet(pOptions,guessOptionBits["winchDetected"]) && isBitSet(pOptions,guessOptionBits["winch"]))) upDateCheckbox("opt_winch_"+type,true);
        if((isBitSet(pOptions,guessOptionBits["foilDetected"]) && isBitSet(pOptions,guessOptionBits["foil"])))   upDateCheckbox("opt_foils_"+type,true);
        if((isBitSet(pOptions,guessOptionBits["hullDetected"]) && isBitSet(pOptions,guessOptionBits["hull"])))   upDateCheckbox("opt_hull_"+type,true);
    }
}

export function onRouteListClick(target) {
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;

    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
  // clic sur label
    const lbl = target.closest?.('label[id^="lbl_rt_name_Lmap:"]');
    if (lbl) {
        const name = lbl.id.slice('lbl_rt_name_Lmap:'.length);
        if(rid && mapState.route[rid][name])
        {
            if(mapState.route[rid][name].displayed)
            {
                mapState.route[rid][name].displayed = false;
                document.getElementById('sel_rt_name_Lmap:'+name).checked=false;
                hideRoute(name);
            } else
            {
                mapState.route[rid][name].displayed = true;
                document.getElementById('sel_rt_name_Lmap:'+name).checked=true;
                showRoute(name);    
            }
        }
        return;
    }

  // change sur color input
    const color = target.closest?.('input[type="color"][id^="color_rt_name_Lmap:"]');
    if (color) {
        const name = color.id.slice('color_rt_name_Lmap:'.length);
        const value = color.value;
        if(rid && mapState.route[rid][name])
        {
            if(mapState.route[rid][name].color != value) {
                mapState.route[rid][name].color = value;
                document.getElementById('color_rt_name_Lmap:'+name).value=mapState.route[rid][name].color;
                importRoute(mapState.route[rid][name],name);
            }
        }
        return;
    }
}


export function updateRouteListHTML()
{
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;
    
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    var tableBody =  '<tbody>';

    var routeList = mapState.route[rid];
    if(routeList) {
        Object.keys(routeList).forEach(function (name) {
            tableBody += '<tr class="rt_lst_line">';
                tableBody += '<td class="rt_lst_name noBorderElt">';
                    tableBody += '<input type="checkbox" id="';
                    tableBody += 'sel_rt_name_Lmap:'+name;
                    tableBody += '" name="checkbox3" class="content hidden"';
                    if(routeList[name].displayed) tableBody += 'checked';
                    tableBody += '>';

                    tableBody += '<label for:"'+'sel_rt_name_Lmap:'+name + '" id="'+'lbl_rt_name_Lmap:'+name +'">'; 
                    tableBody += routeList[name].displayedName +'</label>';
                tableBody += '</td>'    
            tableBody += '<td class="rt_lst_color noBorderElt">';
                tableBody += '<input  type="color" id="color_rt_name_Lmap:'+name +'" value="';
                tableBody += routeList[name].color +'">';
            tableBody += '</td>'
            tableBody += '</tr>'

        });
    }
 
    tableBody +=  '</tbody>';
    document.getElementById("route_list_tableLmap").innerHTML = tableBody;
}

export function displayMapTrace(rid,routeName)
{
    const route = mapState?.route?.[rid]?.[routeName];
    if(!route) return;
    importRoute(route,routeName);
    route.displayed = true;
    document.getElementById('sel_rt_name_Lmap:'+routeName).checked=true;
}

// Help for import
export function showsMapHelp(){
    var msg = "Affichage des traits de côtes :\n" +
        "- Zoomer sur la zone de la carte où vous souhaitez afficher les traits de côtes. Ils apparaissent automatiquement en bleu après quelques instants. Pour afficher une zone différente, dézoomez et zommez à l'endroit désiré.\n- La couleur des traits de côtes peut être personnalisée (Sélection couleur 'Côtes')\n\n" + 
        "Importer un routage :\n" +
        "- Zezo : importer automatiquement la route suggérée par Zezo en cliquant sur 'Import'.\n" +
        "- Avalon : depuis votre logiciel Avalon, exportez votre route au format CSV et importez le fichier.\n" +
        "- VRZen : depuis le site du routeur VRZen, exportez votre route au format CSV et importez le fichier.\n" +
        "- Autre : importez un fichier au format GPX après avoir sélectionné son emplacement.\n\n" +
        "Copier les coordonnées pointées par la souris :\n" +
        "- Appuyez en même temps sur les touches de votre clavier : CTRL + B (ou Cmd + B sur Mac). Les coordonnées seront copiées dans le Presse-papier. Pour les réutiliser, il faudra réaliser l'action \"Coller\" (CTRL + V).\n\n" +
        "Outil Règle :\n" +
        "- Pour l'utiliser, il faut activer l'outil en cliquant sur le bouton. Puis, un premier clic gauche sur un emplacement de la carte début le tracé de mesure, un second clic gauche termine le tracé de mesure et permet de débuter un nouveau tracé de mesure. Les tracés terminés restent affichés tant que l'outil est activé.\n" +
        "- La touche « Echap » annule le tracé de mesure en cours non terminé. Une deuxième pression sur cette touche désactive l'outil.";
        
    alert(msg);
}