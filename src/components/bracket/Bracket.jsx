import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  TOURNAMENT_MODE_DOUBLE,
  TOURNAMENT_MODE_GROUPS,
  TOURNAMENT_MODE_SINGLE,
} from "../../Constants";
import {
  buildTournamentView,
  isBracketGenerated,
} from "../../utils/bracket";
import styles from "./Bracket.module.css";

const CARD_HEIGHT = 94;
const LANE_STEP = 128;

const roundLabel = (roundIndex, totalRounds) => {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semi-finals";
  if (remaining === 3) return "Quarter-finals";
  return `Round of ${2 ** remaining}`;
};

const modeLabel = (mode) => {
  if (mode === TOURNAMENT_MODE_DOUBLE) return "Double elimination";
  if (mode === TOURNAMENT_MODE_GROUPS) return "Group stage + playoffs";
  return "Single elimination";
};

const parseScoreInput = (rawValue) => {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
};

const formatMatchResultText = (match) => {
  const result = match.matchResult;
  if (result?.replayRequested) {
    return "Replay requested";
  }

  const scoreKnown =
    typeof result?.scoreOne === "number" && typeof result?.scoreTwo === "number";
  const scoreText = scoreKnown ? `${result.scoreOne}:${result.scoreTwo}` : "no score";
  const winnerText = match.winner ? `winner: ${match.winner.name}` : "winner: TBD";
  const technicalText = result?.technicalForfeitLoserId ? " | technical defeat" : "";
  return `${scoreText} | ${winnerText}${technicalText}`;
};

const computeRoundLayout = (rounds) => {
  if (!rounds || rounds.length === 0) {
    return { layoutByRound: [], stageHeight: CARD_HEIGHT + 20 };
  }

  const layoutByRound = [];
  const firstRoundCount = rounds[0].length || 1;
  const baseStep = LANE_STEP;
  const minCenter = baseStep / 2;
  const maxCenter = minCenter + (firstRoundCount - 1) * baseStep;

  const createFallbackCenter = (index, total) => {
    if (total <= 1) {
      return (minCenter + maxCenter) / 2;
    }
    const ratio = index / (total - 1);
    return minCenter + ratio * (maxCenter - minCenter);
  };

  rounds.forEach((matches, roundIndex) => {
    const prevMap = roundIndex > 0 ? layoutByRound[roundIndex - 1].centers : {};
    const centers = {};
    const positions = matches.map((match, matchIndex) => {
      const sourceKeys = match.sourceMatchKeys || [];
      const sourceCenters = sourceKeys
        .map((key) => prevMap[key])
        .filter((value) => typeof value === "number");

      let center = createFallbackCenter(matchIndex, matches.length);
      if (sourceCenters.length === 1) {
        center = sourceCenters[0];
      }
      if (sourceCenters.length >= 2) {
        center = sourceCenters.reduce((sum, value) => sum + value, 0) / sourceCenters.length;
      }

      centers[match.key] = center;
      return {
        key: match.key,
        center,
        sourceCenters,
      };
    });

    layoutByRound.push({ centers, positions });
  });

  const allCenters = layoutByRound
    .flatMap((round) => round.positions.map((item) => item.center))
    .filter((value) => typeof value === "number");
  const maxCenterValue = allCenters.length > 0 ? Math.max(...allCenters) : minCenter;
  const stageHeight = Math.max(maxCenterValue + CARD_HEIGHT / 2 + 18, CARD_HEIGHT + 20);

  return { layoutByRound, stageHeight };
};

const renderBoard = ({
  rounds,
  setMatchWinner,
  tournamentId,
  isCompleted,
  onEditMatch,
  onReplayMatch,
}) => {
  if (!rounds || rounds.length === 0) {
    return <p className={styles.empty}>No rounds yet.</p>;
  }

  const { layoutByRound, stageHeight } = computeRoundLayout(rounds);

  return (
    <section className={styles.stage}>
      <div className={styles.board} style={{ "--stage-height": `${stageHeight}px` }}>
        {rounds.map((matches, roundIndex) => (
          <article key={`round-${roundIndex}`} className={styles.roundColumn}>
            <h2
              className={`${styles.roundTitle} ${
                roundIndex === rounds.length - 1 ? styles.roundTitleFinal : ""
              }`}
            >
              {roundLabel(roundIndex, rounds.length)}
            </h2>
            <div className={styles.roundBody}>
              {matches.map((match, matchIndex) => {
                const layout = layoutByRound[roundIndex]?.positions[matchIndex];
                const center = layout?.center ?? CARD_HEIGHT / 2;
                const top = center - CARD_HEIGHT / 2;
                const isLastRound = roundIndex === rounds.length - 1;
                const pairIndex = matchIndex % 2 === 0 ? matchIndex + 1 : matchIndex - 1;
                const pairLayout = layoutByRound[roundIndex]?.positions[pairIndex];
                const hasPair = Boolean(pairLayout);
                const branchHeight = hasPair
                  ? Math.abs(pairLayout.center - center) / 2
                  : 0;
                const branchTop =
                  hasPair && pairLayout.center > center
                    ? "50%"
                    : `calc(50% - ${branchHeight}px)`;
                const hasPrevRoundSource = (layout?.sourceCenters?.length || 0) > 0;

                return (
                  <div key={match.key} className={styles.matchNode} style={{ top: `${top}px` }}>
                    {!isLastRound && hasPair && (
                      <span className={styles.connectorRight} />
                    )}
                    {!isLastRound && hasPair && (
                      <span
                        className={styles.connectorBranch}
                        style={{ height: `${branchHeight}px`, top: branchTop }}
                      />
                    )}
                    {roundIndex > 0 && hasPrevRoundSource && (
                      <span className={styles.connectorLeft} />
                    )}
                    <div className={styles.match}>
                      <button
                        type="button"
                        className={`${styles.teamButton} ${
                          match.winner?.id === match.teamOne?.id ? styles.teamButtonActive : ""
                        }`}
                        onClick={() =>
                          match.teamOne &&
                          setMatchWinner(tournamentId, match.key, match.teamOne.id)
                        }
                        disabled={!match.teamOne || !match.teamTwo || isCompleted}
                      >
                        {match.teamOne ? match.teamOne.name : "TBD"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.teamButton} ${
                          match.winner?.id === match.teamTwo?.id ? styles.teamButtonActive : ""
                        }`}
                        onClick={() =>
                          match.teamTwo &&
                          setMatchWinner(tournamentId, match.key, match.teamTwo.id)
                        }
                        disabled={!match.teamOne || !match.teamTwo || isCompleted}
                      >
                        {match.teamTwo ? match.teamTwo.name : "TBD"}
                      </button>
                      <span className={styles.meta} />
                      <small className={styles.resultText}>{formatMatchResultText(match)}</small>
                      <div className={styles.matchActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onEditMatch(match)}
                          disabled={!match.teamOne || !match.teamTwo || isCompleted}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                          onClick={() => onReplayMatch(match)}
                          disabled={isCompleted}
                        >
                          Replay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const Bracket = ({
  tournaments,
  setMatchWinner,
  setMatchResult,
  requestMatchReplay,
  resetTournamentBracket,
  generateTournamentBracket,
}) => {
  const { tournamentId } = useParams();
  const [editingMatch, setEditingMatch] = useState(null);
  const [scoreOneInput, setScoreOneInput] = useState("");
  const [scoreTwoInput, setScoreTwoInput] = useState("");
  const [winnerInput, setWinnerInput] = useState("");
  const [technicalForfeit, setTechnicalForfeit] = useState(false);
  const [matchFormError, setMatchFormError] = useState("");
  const [replayMatchTarget, setReplayMatchTarget] = useState(null);

  const tournament = useMemo(
    () => tournaments.find((item) => item.id === tournamentId),
    [tournaments, tournamentId]
  );

  if (!tournament) {
    return <Navigate to="/" replace />;
  }

  const view = buildTournamentView({
    ...tournament,
    mode: tournament.mode || TOURNAMENT_MODE_SINGLE,
  });
  const champion = view.champion;
  const isCompleted = Boolean(tournament.completedAt);
  const generated = isBracketGenerated(tournament);

  const openEditModal = (match) => {
    if (!match.teamOne || !match.teamTwo) {
      return;
    }
    const result = match.matchResult || {};
    setEditingMatch(match);
    setScoreOneInput(result.scoreOne ?? "");
    setScoreTwoInput(result.scoreTwo ?? "");
    setWinnerInput(
      result.winnerId === match.teamOne.id
        ? "one"
        : result.winnerId === match.teamTwo.id
          ? "two"
          : ""
    );
    setTechnicalForfeit(Boolean(result.technicalForfeitLoserId));
    setMatchFormError("");
  };

  const closeEditModal = () => {
    setEditingMatch(null);
    setMatchFormError("");
  };

  const saveMatchResult = () => {
    if (!editingMatch?.teamOne || !editingMatch?.teamTwo) {
      return;
    }

    const scoreOne = parseScoreInput(scoreOneInput);
    const scoreTwo = parseScoreInput(scoreTwoInput);
    if (scoreOne === undefined || scoreTwo === undefined) {
      setMatchFormError("Score must be a non-negative integer.");
      return;
    }

    if (winnerInput !== "one" && winnerInput !== "two") {
      setMatchFormError("Choose a winner.");
      return;
    }

    const winnerId =
      winnerInput === "one" ? editingMatch.teamOne.id : editingMatch.teamTwo.id;
    const loserId =
      winnerId === editingMatch.teamOne.id
        ? editingMatch.teamTwo.id
        : editingMatch.teamOne.id;

    setMatchResult(tournament.id, editingMatch.key, {
      winnerId,
      scoreOne,
      scoreTwo,
      technicalForfeitLoserId: technicalForfeit ? loserId : null,
    });
    closeEditModal();
  };

  const openReplayModal = (match) => {
    setReplayMatchTarget(match);
  };

  const closeReplayModal = () => {
    setReplayMatchTarget(null);
  };

  const confirmReplay = () => {
    if (!replayMatchTarget) {
      return;
    }
    requestMatchReplay(tournament.id, replayMatchTarget.key);
    closeReplayModal();
  };

  if (tournament.teams.length < 2) {
    return (
      <main className={styles.page}>
        <h1>{tournament.name}</h1>
        <p>Add at least 2 teams to generate a bracket.</p>
        <Link to={`/tournament/${tournament.id}/teams`} className="btn btn-primary">
          Back to Teams
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{tournament.name}</h1>
          <p>
            Mode: {modeLabel(tournament.mode)} | Status: {isCompleted ? "Completed" : "In progress"}
          </p>
        </div>
        <div className={styles.headerActions}>
          {!isCompleted && generated && (
            <button
              type="button"
              className="btn btn-outline-warning"
              onClick={() => resetTournamentBracket(tournament.id)}
            >
              Reset Bracket
            </button>
          )}
          <Link to={`/tournament/${tournament.id}/teams`} className="btn btn-outline-secondary">
            Teams
          </Link>
          <Link to="/" className="btn btn-outline-secondary">
            All tournaments
          </Link>
        </div>
      </header>

      {champion && (
        <section className={styles.champion}>
          Champion: <strong>{champion.name}</strong>
        </section>
      )}

      {!generated ? (
        <section className={styles.generateCard}>
          <p>Bracket is not generated yet.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => generateTournamentBracket(tournament.id)}
            disabled={isCompleted}
          >
            Generate Bracket (Random)
          </button>
        </section>
      ) : (
        <>
          {view.mode === TOURNAMENT_MODE_GROUPS && (
            <section className={styles.groupsWrap}>
              <h2>Group Stage</h2>
              <div className={styles.groupsGrid}>
                {view.groups.map((group) => (
                  <article key={group.id} className={styles.groupCard}>
                    <h3>{group.name}</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>Pts</th>
                          <th>W</th>
                          <th>L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.standings.map((row) => (
                          <tr key={row.team.id}>
                            <td>{row.team.name}</td>
                            <td>{row.points}</td>
                            <td>{row.wins}</td>
                            <td>{row.losses}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.groupMatches}>
                      {group.matches.map((match) => (
                        <div key={match.key} className={styles.groupMatchRow}>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              match.winner?.id === match.teamOne.id
                                ? "btn-success"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() =>
                              setMatchWinner(tournament.id, match.key, match.teamOne.id)
                            }
                            disabled={isCompleted}
                          >
                            {match.teamOne.name}
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              match.winner?.id === match.teamTwo.id
                                ? "btn-success"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() =>
                              setMatchWinner(tournament.id, match.key, match.teamTwo.id)
                            }
                            disabled={isCompleted}
                          >
                            {match.teamTwo.name}
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => openEditModal(match)}
                            disabled={isCompleted}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                            onClick={() => openReplayModal(match)}
                            disabled={isCompleted}
                          >
                            Replay
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view.sections.map((section) => (
            <section key={section.id} className={styles.sectionWrap}>
              <h2>{section.title}</h2>
              {renderBoard({
                rounds: section.rounds,
                setMatchWinner,
                tournamentId: tournament.id,
                isCompleted,
                onEditMatch: openEditModal,
                onReplayMatch: openReplayModal,
              })}
            </section>
          ))}
        </>
      )}

      {editingMatch && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>Edit Match Result</h3>
            <p className={styles.modalSub}>
              {editingMatch.teamOne?.name} vs {editingMatch.teamTwo?.name}
            </p>

            <div className={styles.modalGrid}>
              <label>
                Score: {editingMatch.teamOne?.name}
                <input
                  className="form-control"
                  value={scoreOneInput}
                  onChange={(event) => setScoreOneInput(event.target.value)}
                  placeholder="e.g. 2"
                />
              </label>
              <label>
                Score: {editingMatch.teamTwo?.name}
                <input
                  className="form-control"
                  value={scoreTwoInput}
                  onChange={(event) => setScoreTwoInput(event.target.value)}
                  placeholder="e.g. 1"
                />
              </label>
            </div>

            <div className={styles.modalWinner}>
              <p>Winner</p>
              <label>
                <input
                  type="radio"
                  name="winner"
                  value="one"
                  checked={winnerInput === "one"}
                  onChange={(event) => setWinnerInput(event.target.value)}
                />
                {editingMatch.teamOne?.name}
              </label>
              <label>
                <input
                  type="radio"
                  name="winner"
                  value="two"
                  checked={winnerInput === "two"}
                  onChange={(event) => setWinnerInput(event.target.value)}
                />
                {editingMatch.teamTwo?.name}
              </label>
            </div>

            <label className={styles.modalCheck}>
              <input
                type="checkbox"
                checked={technicalForfeit}
                onChange={(event) => setTechnicalForfeit(event.target.checked)}
              />
              Technical defeat
            </label>

            {matchFormError && <p className={styles.modalError}>{matchFormError}</p>}

            <div className={styles.modalActions}>
              <button type="button" className="btn btn-success" onClick={saveMatchResult}>
                Save
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeEditModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {replayMatchTarget && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>Replay Match</h3>
            <p className={styles.modalSub}>
              Reset result for {replayMatchTarget.teamOne?.name || "TBD"} vs{" "}
              {replayMatchTarget.teamTwo?.name || "TBD"}?
            </p>
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-warning" onClick={confirmReplay}>
                Request Replay
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={closeReplayModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Bracket;
