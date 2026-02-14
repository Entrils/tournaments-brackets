import {
  createTournament,
  generateTournamentBracket,
  setMatchResult,
  setMatchWinner,
} from "./index";
import {
  CREATE_TOURNAMENT,
  GENERATE_TOURNAMENT_BRACKET,
  SEEDING_STRATEGY_RANDOM,
  SET_MATCH_RESULT,
  SET_MATCH_WINNER,
  TOURNAMENT_MODE_SINGLE,
} from "../Constants";

describe("actions", () => {
  it("createTournament creates normalized tournament payload", () => {
    const action = createTournament("  Summer Cup  ", TOURNAMENT_MODE_SINGLE);

    expect(action.type).toBe(CREATE_TOURNAMENT);
    expect(action.tournament.name).toBe("Summer Cup");
    expect(action.tournament.mode).toBe(TOURNAMENT_MODE_SINGLE);
    expect(action.tournament.seedingStrategy).toBe(SEEDING_STRATEGY_RANDOM);
    expect(action.tournament.id).toBeTruthy();
    expect(action.tournament.createdAt).toBeTruthy();
  });

  it("generateTournamentBracket includes optional seeding strategy", () => {
    const action = generateTournamentBracket("t-1", { seedingStrategy: "manual" });
    expect(action).toEqual({
      type: GENERATE_TOURNAMENT_BRACKET,
      tournamentId: "t-1",
      seedingStrategy: "manual",
    });
  });

  it("setMatchWinner builds winner action", () => {
    const action = setMatchWinner("t-1", "S-0-0", "a");
    expect(action).toEqual({
      type: SET_MATCH_WINNER,
      tournamentId: "t-1",
      matchKey: "S-0-0",
      winnerId: "a",
    });
  });

  it("setMatchResult builds result action", () => {
    const result = { winnerId: "a", scoreOne: 2, scoreTwo: 1 };
    const action = setMatchResult("t-1", "S-0-0", result);
    expect(action).toEqual({
      type: SET_MATCH_RESULT,
      tournamentId: "t-1",
      matchKey: "S-0-0",
      result,
    });
  });
});
