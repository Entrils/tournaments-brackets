import { tournaments } from "./tournaments";
import {
  CREATE_TOURNAMENT,
  GENERATE_TOURNAMENT_BRACKET,
  SEEDING_STRATEGY_MANUAL,
  SEEDING_STRATEGY_RATING,
  SET_MATCH_WINNER,
  TOURNAMENT_MODE_GROUPS,
  TOURNAMENT_MODE_SINGLE,
} from "../Constants";

const baseTournament = (overrides = {}) => ({
  id: "t-1",
  name: "Cup",
  mode: TOURNAMENT_MODE_SINGLE,
  teams: [],
  bracketTeamIds: null,
  groupTeamIds: null,
  winnerSelections: {},
  matchResults: {},
  seedingStrategy: "random",
  championId: null,
  completedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("tournaments reducer", () => {
  it("handles CREATE_TOURNAMENT", () => {
    const action = {
      type: CREATE_TOURNAMENT,
      tournament: baseTournament({ id: "t-2" }),
    };
    const next = tournaments([], action);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("t-2");
  });

  it("generates single-elim bracket using rating seeding", () => {
    const state = [
      baseTournament({
        teams: [
          { id: "a", name: "A", rating: 1000 },
          { id: "b", name: "B", rating: 1800 },
          { id: "c", name: "C", rating: 1200 },
          { id: "d", name: "D", rating: 1500 },
        ],
      }),
    ];

    const next = tournaments(state, {
      type: GENERATE_TOURNAMENT_BRACKET,
      tournamentId: "t-1",
      seedingStrategy: SEEDING_STRATEGY_RATING,
    });

    expect(next[0].seedingStrategy).toBe(SEEDING_STRATEGY_RATING);
    expect(next[0].bracketTeamIds).toEqual(["b", "d", "c", "a"]);
  });

  it("generates single-elim bracket using manual seeding", () => {
    const state = [
      baseTournament({
        teams: [
          { id: "a", name: "A", manualSeed: 4 },
          { id: "b", name: "B", manualSeed: 1 },
          { id: "c", name: "C", manualSeed: 3 },
          { id: "d", name: "D", manualSeed: 2 },
        ],
      }),
    ];

    const next = tournaments(state, {
      type: GENERATE_TOURNAMENT_BRACKET,
      tournamentId: "t-1",
      seedingStrategy: SEEDING_STRATEGY_MANUAL,
    });

    expect(next[0].bracketTeamIds).toEqual(["b", "d", "c", "a"]);
  });

  it("does not generate group buckets for invalid group team count", () => {
    const state = [
      baseTournament({
        mode: TOURNAMENT_MODE_GROUPS,
        teams: [
          { id: "a", name: "A" },
          { id: "b", name: "B" },
          { id: "c", name: "C" },
        ],
      }),
    ];

    const next = tournaments(state, {
      type: GENERATE_TOURNAMENT_BRACKET,
      tournamentId: "t-1",
      seedingStrategy: SEEDING_STRATEGY_MANUAL,
    });

    expect(next[0].groupTeamIds).toBeNull();
    expect(next[0].bracketTeamIds).toBeNull();
  });

  it("marks tournament as completed when final winner is set", () => {
    const state = [
      baseTournament({
        teams: [
          { id: "a", name: "A" },
          { id: "b", name: "B" },
        ],
        bracketTeamIds: ["a", "b"],
      }),
    ];

    const next = tournaments(state, {
      type: SET_MATCH_WINNER,
      tournamentId: "t-1",
      matchKey: "S-0-0",
      winnerId: "a",
    });

    expect(next[0].championId).toBe("a");
    expect(next[0].completedAt).toBeTruthy();
    expect(next[0].winnerSelections["S-0-0"]).toBe("a");
  });
});
