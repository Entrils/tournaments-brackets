import Team from '../Models/Team'

export const teams = (state = [
    new Team("Team 1", null),
    new Team("Team 2", null),
    new Team("Team 3", null),
    new Team("Team 4", null)
],action) => {
    return state;
}