
import {getUserPrefs} from "../../common/userPrefs.js"
import cfg from '@/config.json';
let sortOrder = 0;
let sortField = "none";

export function setSortField(value)
{
    sortField = value;
}

export function setSortOrder(value)
{
    sortOrder = value;
}

export function getSortField()
{
    return sortField;
}

export function getSortOrder()
{
    return sortOrder;
}

export function isDisplayEnabled(playerIte, userId, connectPlayerId) {
    const userPrefs = getUserPrefs();
    const userFilters = userPrefs.filters;

    if(cfg.debugFilter1)
    {
        console.groupCollapsed(`[isDisplayEnabled] Check for user ${userId}`);
        console.log("→ connectPlayerId :", connectPlayerId);
        console.log("→ playerIte :", playerIte);
        console.log("→ userFilters :", userFilters);
    }
    const conditions = {
        self: (userId === connectPlayerId),
        followed: (playerIte.type2 === "followed" && userFilters.friends),
        team: (playerIte.type2 === "team" && userFilters.team),
        normal: (playerIte.type2 === "normal" && userFilters.opponents),
        top: ((playerIte.type === "top" || playerIte.type2 === "top") && userFilters.top),
        certified: (playerIte.type2 === "certified" && userFilters.certified),
        real: (playerIte.type2 === "real" && userFilters.real),
        sponsor: ((playerIte.type === "sponsor" || playerIte.type2 === "sponsor") && userFilters.sponsors),
        selected: (playerIte.choice === true && userFilters.selected),
        inRace: (playerIte.state === "racing" && userFilters.inRace)
    };

    const result = Object.values(conditions).some(Boolean);
    if(cfg.debugFilter1)
    {

        // Log des résultats de chaque condition
        Object.entries(conditions).forEach(([key, value]) => {
            console.log(`  ${key.padEnd(10)}:`, value);
        });

        console.log("✅ Result :", result);
        console.groupEnd();
    }

    return result;
}
