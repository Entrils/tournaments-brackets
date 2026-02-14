import {
  SEEDING_STRATEGY_MANUAL,
  SEEDING_STRATEGY_RANDOM,
  SEEDING_STRATEGY_RATING,
  TOURNAMENT_MODE_DOUBLE,
  TOURNAMENT_MODE_GROUPS,
  TOURNAMENT_MODE_SINGLE,
} from "../Constants";

const getBracketSize = (teamCount) => 2 ** Math.ceil(Math.log2(teamCount));
export const GROUP_STAGE_ALLOWED_TEAM_COUNTS = [4, 8];

export const isValidGroupsTeamCount = (teamCount) =>
  GROUP_STAGE_ALLOWED_TEAM_COUNTS.includes(teamCount);

export const getGroupsTeamCountValidationMessage = (teamCount) => {
  if (isValidGroupsTeamCount(teamCount)) {
    return "";
  }

  return `Group mode supports only ${GROUP_STAGE_ALLOWED_TEAM_COUNTS.join(
    " or "
  )} teams. Current: ${teamCount}.`;
};

const toSafeInt = (value, { min = 0, fallback = null } = {}) => {
  if (!Number.isInteger(value) || value < min) {
    return fallback;
  }
  return value;
};

const matchKey = (roundIndex, matchIndex, keyPrefix = "") =>
  `${keyPrefix}${roundIndex}-${matchIndex}`;

const getWinnerFromSelection = (teamOne, teamTwo, selectedWinnerId) => {
  if (!teamOne || !teamTwo) {
    return null;
  }

  if (selectedWinnerId === teamOne.id) {
    return teamOne;
  }

  if (selectedWinnerId === teamTwo.id) {
    return teamTwo;
  }

  return null;
};

const getSelectedWinnerId = (winnerSelections, matchResults, key) => {
  const result = matchResults?.[key];

  if (result?.replayRequested) {
    return null;
  }

  if (result?.winnerId) {
    return result.winnerId;
  }

  return winnerSelections?.[key] || null;
};

const buildFirstRoundSlots = (teams) => {
  const bracketSize = getBracketSize(teams.length);
  const byes = bracketSize - teams.length;
  const slots = [];

  let teamIndex = 0;
  let usedByes = 0;

  while (slots.length < bracketSize && teamIndex < teams.length) {
    if (usedByes < byes) {
      slots.push({ team: teams[teamIndex], resolved: true, fromMatchKey: null });
      slots.push({ team: null, resolved: true, fromMatchKey: null });
      teamIndex += 1;
      usedByes += 1;
      continue;
    }

    slots.push({ team: teams[teamIndex], resolved: true, fromMatchKey: null });
    teamIndex += 1;

    if (teamIndex < teams.length && slots.length < bracketSize) {
      slots.push({ team: teams[teamIndex], resolved: true, fromMatchKey: null });
      teamIndex += 1;
    }
  }

  while (slots.length < bracketSize) {
    slots.push({ team: null, resolved: true, fromMatchKey: null });
  }

  return slots;
};

const getWinnerFromMatch = (slotOne, slotTwo, selectedWinnerId) => {
  const teamOne = slotOne.team;
  const teamTwo = slotTwo.team;

  const isByeForOne = slotOne.resolved && slotTwo.resolved && teamOne && !teamTwo;
  const isByeForTwo = slotOne.resolved && slotTwo.resolved && !teamOne && teamTwo;

  if (isByeForOne) {
    return { team: teamOne, resolved: true };
  }

  if (isByeForTwo) {
    return { team: teamTwo, resolved: true };
  }

  if (!teamOne || !teamTwo) {
    return { team: null, resolved: false };
  }

  if (selectedWinnerId === teamOne.id) {
    return { team: teamOne, resolved: true };
  }

  if (selectedWinnerId === teamTwo.id) {
    return { team: teamTwo, resolved: true };
  }

  return { team: null, resolved: false };
};

export const buildSingleEliminationBracket = (
  teams,
  winnerSelections = {},
  keyPrefix = "",
  matchResults = {}
) => {
  if (!Array.isArray(teams) || teams.length < 2) {
    return [];
  }

  const rounds = [];
  let currentRoundSlots = buildFirstRoundSlots(teams);
  let roundIndex = 0;

  while (currentRoundSlots.length > 1) {
    const matches = [];
    const nextRoundSlots = [];

    for (let i = 0; i < currentRoundSlots.length; i += 2) {
      const matchIndex = i / 2;
      const slotOne = currentRoundSlots[i];
      const slotTwo = currentRoundSlots[i + 1];
      const key = matchKey(roundIndex, matchIndex, keyPrefix);
      const selectedWinnerId = getSelectedWinnerId(
        winnerSelections,
        matchResults,
        key
      );
      const winner = getWinnerFromMatch(slotOne, slotTwo, selectedWinnerId);

      matches.push({
        key,
        teamOne: slotOne.team,
        teamTwo: slotTwo.team,
        winner: winner.team,
        matchResult: matchResults[key] || null,
        sourceMatchKeys: [slotOne.fromMatchKey, slotTwo.fromMatchKey].filter(Boolean),
      });
      nextRoundSlots.push({
        ...winner,
        fromMatchKey: key,
      });
    }

    rounds.push(matches);
    currentRoundSlots = nextRoundSlots;
    roundIndex += 1;
  }

  return rounds;
};

const getSingleChampion = (
  teams,
  winnerSelections,
  keyPrefix,
  matchResults = {}
) => {
  const rounds = buildSingleEliminationBracket(
    teams,
    winnerSelections,
    keyPrefix,
    matchResults
  );
  const champion = rounds[rounds.length - 1]?.[0]?.winner || null;
  return { rounds, champion };
};

const emptyResolvedSlot = () => ({ team: null, resolved: true, fromMatchKey: null });

const compactSlots = (slots) =>
  slots.filter((slot) => slot && !(slot.resolved && !slot.team));

const ensureEvenSlots = (slots) =>
  slots.length % 2 === 1 ? [...slots, emptyResolvedSlot()] : slots;

const getLoserSlotFromMatch = (match) => {
  const { teamOne, teamTwo, winner } = match;

  if (!teamOne && !teamTwo) {
    return emptyResolvedSlot();
  }

  if (teamOne && !teamTwo) {
    return emptyResolvedSlot();
  }

  if (!teamOne && teamTwo) {
    return emptyResolvedSlot();
  }

  if (!winner) {
    return { team: null, resolved: false, fromMatchKey: match.key };
  }

  return {
    team: winner.id === teamOne.id ? teamTwo : teamOne,
    resolved: true,
    fromMatchKey: match.key,
  };
};

const buildRoundFromSlots = (
  slots,
  winnerSelections,
  keyPrefix,
  roundIndex,
  matchResults = {}
) => {
  const preparedSlots = ensureEvenSlots(compactSlots(slots));
  if (preparedSlots.length === 0) {
    return { matches: [], winners: [] };
  }

  const matches = [];
  const winners = [];

  for (let i = 0; i < preparedSlots.length; i += 2) {
    const slotOne = preparedSlots[i];
    const slotTwo = preparedSlots[i + 1];
    const matchIndex = i / 2;
    const key = matchKey(roundIndex, matchIndex, keyPrefix);
    const selectedWinnerId = getSelectedWinnerId(
      winnerSelections,
      matchResults,
      key
    );
    const winner = getWinnerFromMatch(slotOne, slotTwo, selectedWinnerId);

    matches.push({
      key,
      teamOne: slotOne.team,
      teamTwo: slotTwo.team,
      winner: winner.team,
      matchResult: matchResults[key] || null,
      sourceMatchKeys: [slotOne.fromMatchKey, slotTwo.fromMatchKey].filter(Boolean),
    });
    winners.push({
      ...winner,
      fromMatchKey: key,
    });
  }

  return { matches, winners };
};

const combineForEliminationRound = (fromLower, fromUpper) => {
  const maxLength = Math.max(fromLower.length, fromUpper.length);
  const combined = [];

  for (let i = 0; i < maxLength; i += 1) {
    const lowerSlot = fromLower[i] || emptyResolvedSlot();
    const upperSlot = fromUpper[i] || emptyResolvedSlot();

    const bothEmptyResolved =
      lowerSlot.resolved &&
      upperSlot.resolved &&
      !lowerSlot.team &&
      !upperSlot.team;

    if (!bothEmptyResolved) {
      combined.push(lowerSlot, upperSlot);
    }
  }

  return combined;
};

export const buildDoubleEliminationBracket = (
  teams,
  winnerSelections = {},
  matchResults = {}
) => {
  const upperRounds = buildSingleEliminationBracket(
    teams,
    winnerSelections,
    "U-",
    matchResults
  );
  const lowerRounds = [];
  let lowerRoundIndex = 0;

  if (upperRounds.length > 0) {
    let lowerSlots = upperRounds[0].map(getLoserSlotFromMatch);

    const firstLowerRound = buildRoundFromSlots(
      lowerSlots,
      winnerSelections,
      "L-",
      lowerRoundIndex,
      matchResults
    );
    if (firstLowerRound.matches.length > 0) {
      lowerRounds.push(firstLowerRound.matches);
      lowerSlots = firstLowerRound.winners;
      lowerRoundIndex += 1;
    } else {
      lowerSlots = firstLowerRound.winners;
    }

    for (let upperRoundIndex = 1; upperRoundIndex < upperRounds.length; upperRoundIndex += 1) {
      const incomingLosers = upperRounds[upperRoundIndex].map(getLoserSlotFromMatch);
      const eliminationSlots = combineForEliminationRound(lowerSlots, incomingLosers);
      const eliminationRound = buildRoundFromSlots(
        eliminationSlots,
        winnerSelections,
        "L-",
        lowerRoundIndex,
        matchResults
      );

      if (eliminationRound.matches.length > 0) {
        lowerRounds.push(eliminationRound.matches);
        lowerSlots = eliminationRound.winners;
        lowerRoundIndex += 1;
      } else {
        lowerSlots = eliminationRound.winners;
      }

      const isLastUpperRound = upperRoundIndex === upperRounds.length - 1;
      if (!isLastUpperRound) {
        const consolidationRound = buildRoundFromSlots(
          lowerSlots,
          winnerSelections,
          "L-",
          lowerRoundIndex,
          matchResults
        );
        if (consolidationRound.matches.length > 0) {
          lowerRounds.push(consolidationRound.matches);
          lowerSlots = consolidationRound.winners;
          lowerRoundIndex += 1;
        } else {
          lowerSlots = consolidationRound.winners;
        }
      }
    }
  }

  const finalRounds = [];
  let champion = null;
  const upperChampion = upperRounds[upperRounds.length - 1]?.[0]?.winner || null;
  const lowerChampion = lowerRounds[lowerRounds.length - 1]?.[0]?.winner || null;

  if (upperChampion || lowerChampion) {
    const gfOneKey = "D-GF-0";
    const gfOneWinner = getWinnerFromSelection(
      upperChampion,
      lowerChampion,
      getSelectedWinnerId(winnerSelections, matchResults, gfOneKey)
    );

    finalRounds.push([
      {
        key: gfOneKey,
        teamOne: upperChampion,
        teamTwo: lowerChampion,
        winner: gfOneWinner,
        matchResult: matchResults[gfOneKey] || null,
        sourceMatchKeys: [
          upperRounds[upperRounds.length - 1]?.[0]?.key || null,
          lowerRounds[lowerRounds.length - 1]?.[0]?.key || null,
        ].filter(Boolean),
      },
    ]);

    if (gfOneWinner && lowerChampion && gfOneWinner.id === lowerChampion.id) {
      const gfResetKey = "D-GF-1";
      const gfResetWinner = getWinnerFromSelection(
        upperChampion,
        lowerChampion,
        getSelectedWinnerId(winnerSelections, matchResults, gfResetKey)
      );

      finalRounds.push([
        {
          key: gfResetKey,
          teamOne: upperChampion,
          teamTwo: lowerChampion,
          winner: gfResetWinner,
          matchResult: matchResults[gfResetKey] || null,
          sourceMatchKeys: [gfOneKey],
        },
      ]);
      champion = gfResetWinner;
    } else {
      champion = gfOneWinner;
    }
  }

  return {
    upperRounds,
    lowerRounds,
    finalRounds,
    champion,
  };
};

const toGroups = (teams, groupTeamIds) => {
  if (!Array.isArray(groupTeamIds)) {
    return [];
  }

  const teamMap = teams.reduce((acc, team) => {
    acc.set(team.id, team);
    return acc;
  }, new Map());

  return groupTeamIds.map((groupIds, groupIndex) => {
    const groupTeams = groupIds.map((id) => teamMap.get(id)).filter(Boolean);
    return {
      id: groupIndex,
      name: `Group ${String.fromCharCode(65 + groupIndex)}`,
      teams: groupTeams,
    };
  });
};

const buildGroupData = (group, winnerSelections, matchResults = {}) => {
  const points = new Map(group.teams.map((team) => [team.id, 0]));
  const wins = new Map(group.teams.map((team) => [team.id, 0]));
  const losses = new Map(group.teams.map((team) => [team.id, 0]));
  const goalsFor = new Map(group.teams.map((team) => [team.id, 0]));
  const goalsAgainst = new Map(group.teams.map((team) => [team.id, 0]));
  const matches = [];

  for (let i = 0; i < group.teams.length; i += 1) {
    for (let j = i + 1; j < group.teams.length; j += 1) {
      const teamOne = group.teams[i];
      const teamTwo = group.teams[j];
      const key = `G-${group.id}-${i}-${j}`;
      const winner = getWinnerFromSelection(
        teamOne,
        teamTwo,
        getSelectedWinnerId(winnerSelections, matchResults, key)
      );

      if (winner) {
        points.set(winner.id, (points.get(winner.id) || 0) + 3);
        wins.set(winner.id, (wins.get(winner.id) || 0) + 1);

        const loserId = winner.id === teamOne.id ? teamTwo.id : teamOne.id;
        losses.set(loserId, (losses.get(loserId) || 0) + 1);
      }

      const scoreOne = toSafeInt(matchResults[key]?.scoreOne, { min: 0 });
      const scoreTwo = toSafeInt(matchResults[key]?.scoreTwo, { min: 0 });
      if (scoreOne !== null && scoreTwo !== null) {
        goalsFor.set(teamOne.id, (goalsFor.get(teamOne.id) || 0) + scoreOne);
        goalsAgainst.set(teamOne.id, (goalsAgainst.get(teamOne.id) || 0) + scoreTwo);
        goalsFor.set(teamTwo.id, (goalsFor.get(teamTwo.id) || 0) + scoreTwo);
        goalsAgainst.set(teamTwo.id, (goalsAgainst.get(teamTwo.id) || 0) + scoreOne);
      }

      matches.push({
        key,
        teamOne,
        teamTwo,
        winner,
        matchResult: matchResults[key] || null,
        sourceMatchKeys: [],
      });
    }
  }

  const baseStandings = [...group.teams]
    .map((team) => ({
      team,
      points: points.get(team.id) || 0,
      wins: wins.get(team.id) || 0,
      losses: losses.get(team.id) || 0,
      goalsFor: goalsFor.get(team.id) || 0,
      goalsAgainst: goalsAgainst.get(team.id) || 0,
      goalDiff: (goalsFor.get(team.id) || 0) - (goalsAgainst.get(team.id) || 0),
      headToHeadPoints: 0,
    }));

  const standingsByPoints = baseStandings.reduce((acc, item) => {
    const key = item.points;
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key).push(item);
    return acc;
  }, new Map());

  const sortedPointValues = [...standingsByPoints.keys()].sort((a, b) => b - a);
  const standings = sortedPointValues.flatMap((pointsValue) => {
    const tied = standingsByPoints.get(pointsValue) || [];
    if (tied.length < 2) {
      return tied;
    }

    const tiedIds = new Set(tied.map((item) => item.team.id));
    const headToHeadPoints = tied.reduce((acc, item) => {
      acc.set(item.team.id, 0);
      return acc;
    }, new Map());

    matches.forEach((match) => {
      if (!match.winner || !match.teamOne || !match.teamTwo) {
        return;
      }
      if (!tiedIds.has(match.teamOne.id) || !tiedIds.has(match.teamTwo.id)) {
        return;
      }

      headToHeadPoints.set(
        match.winner.id,
        (headToHeadPoints.get(match.winner.id) || 0) + 3
      );
    });

    return [...tied]
      .map((item) => ({
        ...item,
        headToHeadPoints: headToHeadPoints.get(item.team.id) || 0,
      }))
      .sort((a, b) => {
        if (b.headToHeadPoints !== a.headToHeadPoints) {
          return b.headToHeadPoints - a.headToHeadPoints;
        }
        if (b.goalDiff !== a.goalDiff) {
          return b.goalDiff - a.goalDiff;
        }
        if (b.goalsFor !== a.goalsFor) {
          return b.goalsFor - a.goalsFor;
        }
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        return a.team.name.localeCompare(b.team.name);
      });
  });

  return {
    ...group,
    standings,
    matches,
  };
};

const getPlayoffParticipants = (groupData) => {
  if (groupData.length === 0) {
    return [];
  }

  if (groupData.length === 1) {
    const rankedTeams = groupData[0].standings.map((item) => item.team);
    const ordered = [rankedTeams[0], rankedTeams[3], rankedTeams[1], rankedTeams[2]];
    return ordered.filter(Boolean);
  }

  if (groupData.length === 2) {
    const a = groupData[0].standings.map((item) => item.team);
    const b = groupData[1].standings.map((item) => item.team);
    return [a[0], b[1], b[0], a[1]].filter(Boolean);
  }

  return groupData.flatMap((group) => group.standings[0]?.team || []).filter(Boolean);
};

export const buildGroupsAndPlayoffsBracket = (
  teams,
  groupTeamIds,
  winnerSelections = {},
  matchResults = {}
) => {
  const groups = toGroups(teams, groupTeamIds).map((group) =>
    buildGroupData(group, winnerSelections, matchResults)
  );

  const playoffParticipants = getPlayoffParticipants(groups);
  const playoffRounds = buildSingleEliminationBracket(
    playoffParticipants,
    winnerSelections,
    "P-",
    matchResults
  );
  const champion = playoffRounds[playoffRounds.length - 1]?.[0]?.winner || null;

  return {
    groups,
    playoffRounds,
    champion,
  };
};

export const createGroupTeamIdBuckets = (teamIds) => {
  if (!Array.isArray(teamIds) || !isValidGroupsTeamCount(teamIds.length)) {
    return null;
  }

  const groupCount = teamIds.length === 8 ? 2 : 1;
  const groups = Array.from({ length: groupCount }, () => []);

  teamIds.forEach((id, index) => {
    groups[index % groupCount].push(id);
  });

  return groups;
};

const byName = (a, b) => a.name.localeCompare(b.name);

export const sortTeamsBySeeding = (teams, strategy = SEEDING_STRATEGY_RANDOM) => {
  if (!Array.isArray(teams)) {
    return [];
  }

  if (strategy === SEEDING_STRATEGY_RATING) {
    return [...teams].sort((a, b) => {
      const ratingA = toSafeInt(a.rating, { min: 0, fallback: -1 });
      const ratingB = toSafeInt(b.rating, { min: 0, fallback: -1 });
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      return byName(a, b);
    });
  }

  if (strategy === SEEDING_STRATEGY_MANUAL) {
    return [...teams].sort((a, b) => {
      const seedA = toSafeInt(a.manualSeed, { min: 1, fallback: Number.MAX_SAFE_INTEGER });
      const seedB = toSafeInt(b.manualSeed, { min: 1, fallback: Number.MAX_SAFE_INTEGER });
      if (seedA !== seedB) {
        return seedA - seedB;
      }
      return byName(a, b);
    });
  }

  if (strategy === SEEDING_STRATEGY_RANDOM) {
    const next = [...teams];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  return [...teams].sort(byName);
};

const getMode = (tournament) => tournament.mode || TOURNAMENT_MODE_SINGLE;

export const isBracketGenerated = (tournament) => {
  const mode = getMode(tournament);
  if (mode === TOURNAMENT_MODE_GROUPS) {
    return Array.isArray(tournament.groupTeamIds);
  }
  return Array.isArray(tournament.bracketTeamIds);
};

export const getBracketTeamsByIds = (tournament) => {
  if (!Array.isArray(tournament.bracketTeamIds)) {
    return [];
  }

  const teamMap = tournament.teams.reduce((acc, team) => {
    acc.set(team.id, team);
    return acc;
  }, new Map());

  return tournament.bracketTeamIds.map((id) => teamMap.get(id)).filter(Boolean);
};

export const buildTournamentView = (tournament) => {
  const mode = getMode(tournament);

  if (mode === TOURNAMENT_MODE_DOUBLE) {
    const bracketTeams = getBracketTeamsByIds(tournament);
    const { upperRounds, lowerRounds, finalRounds, champion } = buildDoubleEliminationBracket(
      bracketTeams,
      tournament.winnerSelections,
      tournament.matchResults
    );

    return {
      mode,
      champion,
      groups: [],
      sections: [
        { id: "upper", title: "Upper bracket", rounds: upperRounds },
        { id: "lower", title: "Lower bracket", rounds: lowerRounds },
        { id: "grand", title: "Grand final", rounds: finalRounds },
      ],
    };
  }

  if (mode === TOURNAMENT_MODE_GROUPS) {
    const { groups, playoffRounds, champion } = buildGroupsAndPlayoffsBracket(
      tournament.teams,
      tournament.groupTeamIds,
      tournament.winnerSelections,
      tournament.matchResults
    );

    return {
      mode,
      champion,
      groups,
      sections: [{ id: "playoff", title: "Playoffs", rounds: playoffRounds }],
    };
  }

  const bracketTeams = getBracketTeamsByIds(tournament);
  const { rounds, champion } = getSingleChampion(
    bracketTeams,
    tournament.winnerSelections,
    "S-",
    tournament.matchResults
  );

  return {
    mode,
    champion,
    groups: [],
    sections: [{ id: "single", title: "Single elimination", rounds }],
  };
};
