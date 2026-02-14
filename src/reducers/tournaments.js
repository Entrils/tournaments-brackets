import {
  ADD_TEAM,
  CREATE_TOURNAMENT,
  DELETE_TEAM,
  DELETE_TOURNAMENT,
  GENERATE_TOURNAMENT_BRACKET,
  REQUEST_MATCH_REPLAY,
  RESET_TOURNAMENT_BRACKET,
  SEEDING_STRATEGY_RANDOM,
  SET_MATCH_RESULT,
  SET_MATCH_WINNER,
  TOURNAMENT_MODE_GROUPS,
  TOURNAMENT_MODE_SINGLE,
  UPDATE_TEAM,
} from "../Constants";
import {
  buildTournamentView,
  createGroupTeamIdBuckets,
  isValidGroupsTeamCount,
  isBracketGenerated,
  sortTeamsBySeeding,
} from "../utils/bracket";

const withTournamentUpdated = (state, tournamentId, updater) =>
  state.map((tournament) =>
    tournament.id === tournamentId ? updater(tournament) : tournament
  );

const resetBracketState = (tournament) => ({
  ...tournament,
  bracketTeamIds: null,
  groupTeamIds: null,
  winnerSelections: {},
  matchResults: {},
  championId: null,
  completedAt: null,
});

const removeWinnerSelection = (winnerSelections, matchKey) => {
  const next = { ...(winnerSelections || {}) };
  delete next[matchKey];
  return next;
};

const enrichCompletionStatus = (tournament) => {
  if (!isBracketGenerated(tournament)) {
    return {
      ...tournament,
      championId: null,
      completedAt: null,
    };
  }

  const { champion } = buildTournamentView(tournament);

  if (!champion) {
    return {
      ...tournament,
      championId: null,
      completedAt: null,
    };
  }

  return {
    ...tournament,
    championId: champion.id,
    completedAt: tournament.completedAt || new Date().toISOString(),
  };
};

const generateByMode = (tournament, seedingStrategy) => {
  const strategy = seedingStrategy || tournament.seedingStrategy || SEEDING_STRATEGY_RANDOM;
  const sortedTeams = sortTeamsBySeeding(tournament.teams, strategy);
  const ids = sortedTeams.map((team) => team.id);
  const base = resetBracketState({
    ...tournament,
    mode: tournament.mode || TOURNAMENT_MODE_SINGLE,
    seedingStrategy: strategy,
  });

  if (tournament.mode === TOURNAMENT_MODE_GROUPS) {
    if (!isValidGroupsTeamCount(ids.length)) {
      return base;
    }

    return {
      ...base,
      groupTeamIds: createGroupTeamIdBuckets(ids),
    };
  }

  return {
    ...base,
    bracketTeamIds: ids,
  };
};

export const tournaments = (state = [], action) => {
  switch (action.type) {
    case CREATE_TOURNAMENT:
      return [action.tournament, ...state];
    case DELETE_TOURNAMENT:
      return state.filter((tournament) => tournament.id !== action.tournamentId);
    case ADD_TEAM:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt) {
          return tournament;
        }
        return resetBracketState({
          ...tournament,
          teams: [...tournament.teams, action.team],
        });
      });
    case UPDATE_TEAM:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt) {
          return tournament;
        }
        return resetBracketState({
          ...tournament,
          teams: tournament.teams.map((team) =>
            team.id === action.team.id ? action.team : team
          ),
        });
      });
    case DELETE_TEAM:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt) {
          return tournament;
        }
        return resetBracketState({
          ...tournament,
          teams: tournament.teams.filter((team) => team.id !== action.teamId),
        });
      });
    case GENERATE_TOURNAMENT_BRACKET:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt || tournament.teams.length < 2) {
          return tournament;
        }

        return generateByMode(tournament, action.seedingStrategy);
      });
    case SET_MATCH_WINNER:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt || !isBracketGenerated(tournament)) {
          return tournament;
        }

        return enrichCompletionStatus({
          ...tournament,
          winnerSelections: {
            ...tournament.winnerSelections,
            [action.matchKey]: action.winnerId,
          },
          matchResults: {
            ...(tournament.matchResults || {}),
            [action.matchKey]: {
              ...(tournament.matchResults?.[action.matchKey] || {}),
              winnerId: action.winnerId,
              replayRequested: false,
            },
          },
        });
      });
    case SET_MATCH_RESULT:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt || !isBracketGenerated(tournament)) {
          return tournament;
        }

        const result = action.result || {};
        return enrichCompletionStatus({
          ...tournament,
          winnerSelections: {
            ...tournament.winnerSelections,
            [action.matchKey]: result.winnerId || null,
          },
          matchResults: {
            ...(tournament.matchResults || {}),
            [action.matchKey]: {
              ...(tournament.matchResults?.[action.matchKey] || {}),
              ...result,
              replayRequested: false,
            },
          },
        });
      });
    case REQUEST_MATCH_REPLAY:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt || !isBracketGenerated(tournament)) {
          return tournament;
        }

        return enrichCompletionStatus({
          ...tournament,
          winnerSelections: removeWinnerSelection(
            tournament.winnerSelections,
            action.matchKey
          ),
          matchResults: {
            ...(tournament.matchResults || {}),
            [action.matchKey]: {
              ...(tournament.matchResults?.[action.matchKey] || {}),
              winnerId: null,
              scoreOne: null,
              scoreTwo: null,
              technicalForfeitLoserId: null,
              replayRequested: true,
            },
          },
        });
      });
    case RESET_TOURNAMENT_BRACKET:
      return withTournamentUpdated(state, action.tournamentId, (tournament) => {
        if (tournament.completedAt) {
          return tournament;
        }
        return resetBracketState(tournament);
      });
    default:
      return state;
  }
};
