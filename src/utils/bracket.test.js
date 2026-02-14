import {
  buildGroupsAndPlayoffsBracket,
  createGroupTeamIdBuckets,
  getGroupsTeamCountValidationMessage,
  isValidGroupsTeamCount,
  sortTeamsBySeeding,
} from "./bracket";
import {
  SEEDING_STRATEGY_MANUAL,
  SEEDING_STRATEGY_RANDOM,
  SEEDING_STRATEGY_RATING,
} from "../Constants";

const team = (id, name, extra = {}) => ({
  id,
  name,
  ...extra,
});

describe("bracket utils", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("group team count validation", () => {
    it("accepts only 4 or 8 teams", () => {
      expect(isValidGroupsTeamCount(4)).toBe(true);
      expect(isValidGroupsTeamCount(8)).toBe(true);
      expect(isValidGroupsTeamCount(2)).toBe(false);
      expect(isValidGroupsTeamCount(6)).toBe(false);
    });

    it("returns validation message for invalid counts", () => {
      expect(getGroupsTeamCountValidationMessage(4)).toBe("");
      expect(getGroupsTeamCountValidationMessage(5)).toContain("Current: 5");
    });
  });

  describe("group bucket creation", () => {
    it("returns one group for 4 teams", () => {
      const groups = createGroupTeamIdBuckets(["a", "b", "c", "d"]);
      expect(groups).toEqual([["a", "b", "c", "d"]]);
    });

    it("returns two groups for 8 teams", () => {
      const groups = createGroupTeamIdBuckets(["a", "b", "c", "d", "e", "f", "g", "h"]);
      expect(groups).toEqual([
        ["a", "c", "e", "g"],
        ["b", "d", "f", "h"],
      ]);
    });

    it("returns null for invalid team count", () => {
      expect(createGroupTeamIdBuckets(["a", "b", "c"])).toBeNull();
    });
  });

  describe("seeding sort", () => {
    const teams = [
      team("1", "Beta", { rating: 1000, manualSeed: 2 }),
      team("2", "Alpha", { rating: 1200, manualSeed: 1 }),
      team("3", "Gamma", { rating: null, manualSeed: null }),
    ];

    it("sorts by rating desc for rating strategy", () => {
      const sorted = sortTeamsBySeeding(teams, SEEDING_STRATEGY_RATING);
      expect(sorted.map((t) => t.id)).toEqual(["2", "1", "3"]);
    });

    it("sorts by manual seed for manual strategy", () => {
      const sorted = sortTeamsBySeeding(teams, SEEDING_STRATEGY_MANUAL);
      expect(sorted.map((t) => t.id)).toEqual(["2", "1", "3"]);
    });

    it("shuffles for random strategy", () => {
      const randomSpy = jest
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9);
      const sorted = sortTeamsBySeeding(teams, SEEDING_STRATEGY_RANDOM);
      expect(sorted).toHaveLength(3);
      expect(sorted.map((t) => t.id).sort()).toEqual(["1", "2", "3"]);
      expect(randomSpy).toHaveBeenCalled();
    });
  });

  describe("groups tie-breakers", () => {
    it("uses head-to-head points first, then goal diff", () => {
      const teams = [
        team("a", "A-Team"),
        team("b", "B-Team"),
        team("c", "C-Team"),
        team("d", "D-Team"),
      ];
      const groupTeamIds = [["a", "b", "c", "d"]];
      const winnerSelections = {
        "G-0-0-1": "a", // a beats b
        "G-0-0-2": "c", // c beats a
        "G-0-0-3": "a", // a beats d
        "G-0-1-2": "b", // b beats c
        "G-0-1-3": "b", // b beats d
        "G-0-2-3": "c", // c beats d
      };
      const matchResults = {
        "G-0-0-1": { winnerId: "a", scoreOne: 2, scoreTwo: 0 },
        "G-0-0-2": { winnerId: "c", scoreOne: 0, scoreTwo: 1 },
        "G-0-0-3": { winnerId: "a", scoreOne: 2, scoreTwo: 0 },
        "G-0-1-2": { winnerId: "b", scoreOne: 2, scoreTwo: 0 },
        "G-0-1-3": { winnerId: "b", scoreOne: 3, scoreTwo: 0 },
        "G-0-2-3": { winnerId: "c", scoreOne: 1, scoreTwo: 0 },
      };

      const result = buildGroupsAndPlayoffsBracket(
        teams,
        groupTeamIds,
        winnerSelections,
        matchResults
      );
      const standings = result.groups[0].standings;

      expect(standings[0].team.id).toBe("b");
      expect(standings[1].team.id).toBe("a");
      expect(standings[2].team.id).toBe("c");

      expect(standings[0].headToHeadPoints).toBe(3);
      expect(standings[1].headToHeadPoints).toBe(3);
      expect(standings[2].headToHeadPoints).toBe(3);
      expect(standings[0].goalDiff).toBeGreaterThanOrEqual(standings[1].goalDiff);
      expect(standings[1].goalDiff).toBeGreaterThan(standings[2].goalDiff);
    });
  });
});
