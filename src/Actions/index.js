import { uid } from "uid";
import {
  ADD_TEAM,
  CREATE_TOURNAMENT,
  DELETE_TEAM,
  DELETE_TOURNAMENT,
  GENERATE_TOURNAMENT_BRACKET,
  REQUEST_MATCH_REPLAY,
  RESET_TOURNAMENT_BRACKET,
  SET_MATCH_RESULT,
  SET_MATCH_WINNER,
  SEEDING_STRATEGY_RANDOM,
  TOURNAMENT_MODE_SINGLE,
  UPDATE_TEAM,
} from "../Constants";

export const createTournament = (name, mode = TOURNAMENT_MODE_SINGLE) => ({
  type: CREATE_TOURNAMENT,
  tournament: {
    id: uid(),
    name: name.trim(),
    mode,
    teams: [],
    bracketTeamIds: null,
    groupTeamIds: null,
    winnerSelections: {},
    matchResults: {},
    seedingStrategy: SEEDING_STRATEGY_RANDOM,
    championId: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  },
});

export const deleteTournament = (tournamentId) => ({
  type: DELETE_TOURNAMENT,
  tournamentId,
});

export const addTeam = (tournamentId, team) => ({
  type: ADD_TEAM,
  tournamentId,
  team,
});

export const updateTeam = (tournamentId, team) => ({
  type: UPDATE_TEAM,
  tournamentId,
  team,
});

export const deleteTeam = (tournamentId, teamId) => ({
  type: DELETE_TEAM,
  tournamentId,
  teamId,
});

export const setMatchWinner = (tournamentId, matchKey, winnerId) => ({
  type: SET_MATCH_WINNER,
  tournamentId,
  matchKey,
  winnerId,
});

export const setMatchResult = (tournamentId, matchKey, result) => ({
  type: SET_MATCH_RESULT,
  tournamentId,
  matchKey,
  result,
});

export const requestMatchReplay = (tournamentId, matchKey) => ({
  type: REQUEST_MATCH_REPLAY,
  tournamentId,
  matchKey,
});

export const resetTournamentBracket = (tournamentId) => ({
  type: RESET_TOURNAMENT_BRACKET,
  tournamentId,
});

export const generateTournamentBracket = (tournamentId, options = {}) => ({
  type: GENERATE_TOURNAMENT_BRACKET,
  tournamentId,
  seedingStrategy: options.seedingStrategy || null,
});
