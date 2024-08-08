import { ADD_TEAM } from '../Constants';
import Team from '../Models/Team'

export const teams = (state = [
    new Team("Team 1", null),
    new Team("Team 2", null),
    new Team("Team 3", null),
    new Team("Team 4", null)
],action) => {

    switch (action.type){

        case ADD_TEAM: 
            let team  = action.team;
            let teams = [...state];
            teams.push(team);
            return teams;
        default: 
            return state;
    }
    
}