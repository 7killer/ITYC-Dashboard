export const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];
export const sailColors = ["#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF", "#FF66FF", "#FFC44D", 8, 9,
    // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                    "#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF;", "#FF66FF", "#FFC44D"];
export const creditsMaxAwardedByPriceLevel = [8600, 7150, 5700, 4300, 2850, 1425];
    
                    

export const category = ["real", "certified", "top", "sponsor", "normal", "pilotBoat", "team"];
export const categoryStyle = [
        // real
        {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
        // certified
        {nameStyle: "color: Black;", bcolor: '#1E90FF', bbcolor: '#000000'},
        // top
        {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
        // "sponsor"
        {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
        // "normal"
        {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#000000'},
        // "normal"
        {nameStyle: "color: Black;", bcolor: '#000000'}
    ];
export const categoryStyleDark = [
        // real
        {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
        // certified
        {nameStyle: "color: #a5a5a5;", bcolor: '#1E90FF', bbcolor: '#000000'},
        // top
        {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
        // "sponsor"
        {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
        // "normal"
        {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#000000'},
        // "normal"
        {nameStyle: "color: #a5a5a5;", bcolor: '#000000'}
    ];

