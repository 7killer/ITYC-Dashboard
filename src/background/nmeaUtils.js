import {toDeg, toRad, roundTo} from './../common/utils.js';

const crcTable = makeCRCTable();

export function formatGPRMC (pIte) {
    // http://www.nmea.de/nmea0183datensaetze.html#rmc
    // https://gpsd.gitlab.io/gpsd/NMEA.html#_rmc_recommended_minimum_navigation_information
    const d = new Date(pIte.iteDate || new Date());
    let s = "GPRMC";
    s += "," + formatHHMMSSSS(d) + ",A";             // UTC time & status
    s += "," + formatNMEALatLon(Math.abs(pIte.pos.lat), 11); // Latitude & N/S
    s += "," + ((pIte.pos.lat < 0) ? "S":"N");
    s += "," + formatNMEALatLon(Math.abs(pIte.pos.lon), 12); // Longitude & E/W
    s += "," + ((pIte.pos.lon < 0) ? "W":"E");
    s += "," + pIte.speed.toFixed(5);                        // SOG
    s += "," + pIte.hdg.toFixed(5);                      // Track made good
    s += "," + formatDDMMYY(d);                      // Date
    s += ",,";                                            //
    s += ",A";                                            // Valid
    return s;
}

export function formatIIMWV (pIte) {
    // $IIMWV Wind Speed and Angle
    const tws = pIte.tws || 0;
    const twa = pIte.twa || 0;
    let pTWA = (twa > 0) ? twa : twa + 360;
    let s = "IIMWV";
    s += "," + pTWA + ",T";
    s += "," + tws + ",N";
    s += ",A"
    return s;
}

export function formatIIVWR (pIte) {
    // VWR - Relative Wind Speed and Angle
    // --VWR,x.x,a,x.x,N,x.x,M,x.x,K
    // https://gpsd.gitlab.io/gpsd/NMEA.html#_vwr_relative_wind_speed_and_angle

    const tws = pIte.tws || 0;
    const twa = pIte.twa || 0;
    const sog = pIte.speed || 0;

    // Cosinus law
    const cosTwaLaw = Math.cos(toRad(180 - Math.abs(twa)));
    const aws = Math.sqrt(sog**2 + tws**2 - 2 * sog * tws * cosTwaLaw);
    const awd = toDeg(Math.acos((sog**2 + aws**2 - tws**2) / (2 * sog * aws)));
    const awside = (twa < 0) ? "L" : "R";

    // The message
    let s = "IIVWR";
    s += "," + awd.toFixed(5);
    s += "," + awside;
    s += "," + aws.toFixed(5) + ",N";
    s += ",,,,";
    return s;
}

export function formatIIHDT (pIte) {
    // HDT - Heading - True
    // --HDT,x.x,T
    // https://gpsd.gitlab.io/gpsd/NMEA.html#_hdt_heading_true
    
    let s = "IIHDT";
    s += "," + pIte.hdg.toFixed(5) + ",T";
    return s;
}
export function formatRPM (pIte) {
    // $IIRPM Revolutions used to send stamina
    let stamina = pIte.realStamina || 0;
    if(stamina > 130) stamina = 130;
// Shaft number for sailset
    let s = "IIRPM";
    s += ",E,";
    s += pIte.sail % 10;
    s += "," + stamina.toFixed() + ",0";
    s += ",A"
    return s;
}

export function formatAIVDM_AIS_msg1 (mmsi, pIte) {
    // https://castoo.pagesperso-orange.fr/navigation/analys_nmea_ais.html
    let s = "AIVDM";
    s += "," + "1";                                        // number of fragment
    s += "," + "1";                                        // fragment number
    s += "," + "";                                         // message id
    s += "," + "B";                                        // Radio Canal
    s += "," + formatUtilAIVDM_AIS_msg1(mmsi, pIte);       // payload
    s += ",0"                                              // padding

    return s;
}

export function formatAIVDM_AIS_msg5 (mmsi, pIte) {
    // https://castoo.pagesperso-orange.fr/navigation/analys_nmea_ais.html
    let s = "AIVDM";
    s += "," + "1";                                        // number of fragment
    s += "," + "1";                                        // fragment number
    s += "," + "";                                         // message id
    s += "," + "B";                                        // Radio Canal
    s += "," + formatUtilAIVDM_AIS_msg5(mmsi, pIte);       // payload
    s += ",4"                                              // padding

    return s;
}

function formatUtilAIVDM_AIS_msg1 (mmsi, pIte) {
    let bitArray = [];

    bitArray += longToBitArray(1, 6);                                       // Message type 1
    bitArray += longToBitArray(0, 2);                                       // Message repeat indicator

    bitArray += longToBitArray(mmsi, 30) ;                                  // Boat MMSI
    bitArray += longToBitArray(8, 4);                                       // Nav status -> Navigation
    bitArray += longToBitArray(0, 8);                                       // Rot - rotate level
    bitArray += longToBitArray(roundTo(pIte.speed * 10, 0), 10);            // SOG
    bitArray += longToBitArray(0, 1);                                       // Position accuracy

    bitArray += longToBitArray(roundTo(pIte.pos.lon * 10000 * 60, 0), 28);  // Longitude
    bitArray += longToBitArray(roundTo(pIte.pos.lat * 10000 * 60, 0), 27);  // Latitude
    bitArray += longToBitArray(pIte.hdg*10, 12);                            // COG
    bitArray += longToBitArray(pIte.hdg, 9);                                // HDG
    bitArray += longToBitArray(13, 6);                                      // Time stamp
    bitArray += longToBitArray(0, 1);                                       // other / reserved
    bitArray += longToBitArray(81942, 24);                                  // other / reserved

    // Convert bitArray to ASCII
    return bitArray2ASCII(bitArray);
}

function formatUtilAIVDM_AIS_msg5 (mmsi, pIte) {
    let bitArray = [];

    bitArray += longToBitArray(5, 6);                                       // Message type 5
    bitArray += longToBitArray(0, 2);                                       // Message repeat indicator

    bitArray += longToBitArray(mmsi, 30);                                   // Boat MMSI
    bitArray += longToBitArray(0, 2);                                       // AIS Version
    bitArray += longToBitArray(pIte.mmsi, 30);                             // IMO Number
    bitArray += longToBitArray(0, 42);                                      // Call Sign - 7 six-bit characters
    bitArray += stringToSixBitArray(pIte.displayName, 120/6);              // Vessel Name - 20 six-bit characters
    bitArray += longToBitArray(36, 8);                                      // Ship Type => Sailing
    bitArray += longToBitArray(0, 9);                                       // Dimension to Bow
    bitArray += longToBitArray(0, 9);                                       // Dimension to Stern
    bitArray += longToBitArray(0, 6);                                       // Dimension to Port
    bitArray += longToBitArray(0, 6);                                       // Dimension to Starboard
    bitArray += longToBitArray(0, 4);                                       // Position Fix Type => Undefined
    bitArray += longToBitArray(0, 4);                                       // ETA month => Undefined
    bitArray += longToBitArray(0, 5);                                       // ETA day => Undefined
    bitArray += longToBitArray(0, 5);                                       // ETA hour => Undefined
    bitArray += longToBitArray(0, 6);                                       // ETA minute => Undefined
    bitArray += longToBitArray(0, 8);                                       // Draught
    bitArray += longToBitArray(0, 120);                                     // Destination - 20 six-bit characters
    bitArray += longToBitArray(1, 1);                                       // DTE => 1 == Not ready (default)
    bitArray += longToBitArray(0, 1);                                       // Spare

    // Convert bitArray to ASCII
    return bitArray2ASCII(bitArray);
}

export function nmeaChecksum (s) {
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
        sum ^= s.charCodeAt(i);
    }
    return pad0(sum, 2, 16).toUpperCase();
}

function longToBitArray (long, array_size) {
    let bitArray = [];
    for ( let index = 0; index < array_size ; index ++ ) {
        const byte = long & 1;
        bitArray = [byte] + bitArray;
        long = long >> 1 ;
    }
    return bitArray;
}

function stringToSixBitArray (s, sixBitsArraySize) {
    let bitArray = [];
    s = s.toUpperCase();
    for (var i = 0; i < Math.min(s.length, sixBitsArraySize); i++)
    {
        var b = s.charCodeAt(i);
        bitArray += longToBitArray((b | 64) & 63, 6);
    }
    // Pad with spaces (32)
    if ( s.length < sixBitsArraySize) {
        //bitArray += longToBitArray(0, 6);
        for (var i = 0; i < sixBitsArraySize - s.length; i++) {
            bitArray += longToBitArray(32, 6);
        }
    }
    return bitArray;
}

function bitArray2ASCII (bitArray) {
    // * Prepare conversion
    const map_bit_to_ascii = {};
    for (let i =48; i < 128; i++) {
        let chr_val = i - 48;
        if (chr_val > 40) {
            chr_val = chr_val - 8;
        }

        const bits = longToBitArray(chr_val, 6);
        if ( map_bit_to_ascii[bits] == undefined) {
            map_bit_to_ascii[bits] = String.fromCharCode(i);
        } else {
            if (String.fromCharCode(i) == "`") {
                map_bit_to_ascii[bits] = String.fromCharCode(i);
            }
        }
    }

    // * Convert
    // Pad the bitArray to a round length of 6 bits
    bitArray += longToBitArray(0, 6 - (bitArray.length % 6));
    let str = "";
    for (var i = 0; i < (bitArray.length / 6); i++) {
        str += map_bit_to_ascii[bitArray.slice(i * 6, i * 6 + 6)];
    }
    return str;
}

function makeCRCTable () {
    const crcTable = [];
    for (let n =0; n < 256; n++) {
        let c = n;
        for (var k =0; k < 8; k++) {
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

export function crc32(str) {

    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

function formatHHMMSSSS (d) {
    let s = ""
        + pad0(d.getUTCHours())
        + pad0(d.getUTCMinutes())
        + pad0(d.getUTCSeconds());
    return s;
}

function formatDDMMYY (d) {
    let s = ""
        + pad0(d.getUTCDate())
        + pad0(d.getUTCMonth() + 1)
        + d.getUTCFullYear().toString().substring(2,4);
    return s;        
}

function formatNMEALatLon (l, len) {
    const deg = Math.trunc(l);
    const min = pad0(((l - deg) * 60).toFixed(6), 9);
    const result = "" + deg + min;
    return pad0(result, len);
}

function pad0 (val, length=2, base=10) {
    let result = val.toString(base)
    while (result.length < length) result = '0' + result;
    return result;
}

