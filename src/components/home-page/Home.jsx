import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TOURNAMENT_MODE_DOUBLE,
  TOURNAMENT_MODE_GROUPS,
  TOURNAMENT_MODE_SINGLE,
} from "../../Constants";
import styles from "./Home.module.css";

const modeOptions = [
  { value: TOURNAMENT_MODE_SINGLE, label: "Single elimination" },
  { value: TOURNAMENT_MODE_DOUBLE, label: "Double elimination" },
  { value: TOURNAMENT_MODE_GROUPS, label: "Group stage + playoffs" },
];

const modeLabel = (mode) =>
  modeOptions.find((option) => option.value === mode)?.label ||
  "Single elimination";

const formatDate = (isoDate) => {
  if (!isoDate) {
    return "";
  }
  const date = new Date(isoDate);
  return date.toLocaleString();
};

const Home = ({ tournaments, createTournament, deleteTournament }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mode, setMode] = useState(TOURNAMENT_MODE_SINGLE);
  const [error, setError] = useState("");

  const submitTournament = (event) => {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Tournament name is required.");
      return;
    }

    const action = createTournament(normalizedName, mode);
    setName("");
    setMode(TOURNAMENT_MODE_SINGLE);
    setError("");
    navigate(`/tournament/${action.tournament.id}/teams`);
  };

  const handleDeleteTournament = (tournament) => {
    const shouldDelete = window.confirm(
      `Delete tournament "${tournament.name}"? This action cannot be undone.`
    );
    if (shouldDelete) {
      deleteTournament(tournament.id);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <h1>Tournament Bracket Generator</h1>
        <p>Total tournaments: {tournaments.length}</p>
      </section>

      <section className={styles.createCard}>
        <h2>Create Tournament</h2>
        <form onSubmit={submitTournament} className={styles.createForm}>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) {
                setError("");
              }
            }}
            className="form-control"
            placeholder="Tournament name"
          />
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className="form-control"
          >
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <section className={styles.list}>
        <h2>Tournaments</h2>
        {tournaments.length === 0 && <p>No tournaments yet.</p>}

        <ul>
          {tournaments.map((tournament) => {
            const champion = tournament.teams.find((team) => team.id === tournament.championId);
            const isCompleted = Boolean(tournament.completedAt);

            return (
              <li key={tournament.id} className={styles.item}>
                <div className={styles.info}>
                  <h3>{tournament.name}</h3>
                  <p>Mode: {modeLabel(tournament.mode)}</p>
                  <p>Teams: {tournament.teams.length}</p>
                  <p>Status: {isCompleted ? "Completed" : "In progress"}</p>
                  {champion && <p>Champion: {champion.name}</p>}
                  <small>Created: {formatDate(tournament.createdAt)}</small>
                  {isCompleted && <small>Finished: {formatDate(tournament.completedAt)}</small>}
                </div>
                <div className={styles.actions}>
                  <Link
                    to={`/tournament/${tournament.id}/teams`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Teams
                  </Link>
                  <Link
                    to={`/tournament/${tournament.id}/bracket`}
                    className="btn btn-sm btn-success"
                  >
                    Bracket
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteTournament(tournament)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
};

export default Home;
