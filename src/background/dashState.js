

import {getData,saveData} from '../common/dbOpes.js';
export async function manageDashState(nextState)
{
    const currentDashState = await getData('internal', 'state'); 
    let dashState = currentDashState?.state?currentDashState.state:'dashInstalled';

    if(nextState == 'start') dashState.state = 'dashInstalled';
    else
        switch(dashState)
        {
            case 'dashInstalled' :
                if(nextState == 'playerConnected' || nextState == 'raceOpened')
                    dashState = nextState;
                break;
            case 'playerConnected' :
                if(nextState == 'raceOpened')
                    dashState = nextState;
                break;
            case 'raceOpened':
                if(nextState == 'playerConnected')
                    dashState = nextState;
                break;
        }
    if(currentDashState != dashState)
        await saveData('internal', {id: "state",state:dashState},null,{ updateIfExists: true });
         
}