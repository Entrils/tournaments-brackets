import React, { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Team from "../../Models/Team";
import styles from "./AddTeams.module.css";

const AddTeams = ({ tournaments, addTeam, updateTeam, deleteTeam }) => {
  const { tournamentId } = useParams();
  const tournament = useMemo(
    () => tournaments.find((item) => item.id === tournamentId),
    [tournaments, tournamentId]
  );

  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editImgUrl, setEditImgUrl] = useState("");

  if (!tournament) {
    return <Navigate to="/" replace />;
  }

  const isCompleted = Boolean(tournament.completedAt);

  const hasDuplicate = (candidateName, ignoredId = null) => {
    const normalized = candidateName.trim().toLowerCase();
    return tournament.teams.some(
      (team) =>
        team.id !== ignoredId &&
        String(team.name || "").trim().toLowerCase() === normalized
    );
  };

  const submitTeam = (event) => {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Team name is required.");
      return;
    }

    if (hasDuplicate(normalizedName)) {
      setError("Team with this name already exists.");
      return;
    }

    addTeam(tournament.id, new Team(normalizedName, imgUrl.trim()));
    setName("");
    setImgUrl("");
    setError("");
  };

  const startEdit = (team) => {
    setEditingId(team.id);
    setEditName(team.name || "");
    setEditImgUrl(team.img_url || "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditImgUrl("");
    setError("");
  };

  const saveEdit = (team) => {
    const normalizedName = editName.trim();

    if (!normalizedName) {
      setError("Team name is required.");
      return;
    }

    if (hasDuplicate(normalizedName, team.id)) {
      setError("Team with this name already exists.");
      return;
    }

    updateTeam(tournament.id, {
      ...team,
      name: normalizedName,
      img_url: editImgUrl.trim(),
    });
    cancelEdit();
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div>
            <h1>{tournament.name}</h1>
            <p>Status: {isCompleted ? "Completed" : "In progress"}</p>
          </div>
          <div className={styles.actions}>
            <Link to="/" className="btn btn-outline-secondary">
              All tournaments
            </Link>
            <Link
              to={`/tournament/${tournament.id}/bracket`}
              className={`btn btn-success ${tournament.teams.length < 2 ? "disabled" : ""}`}
              aria-disabled={tournament.teams.length < 2}
              onClick={(event) => {
                if (tournament.teams.length < 2) {
                  event.preventDefault();
                }
              }}
            >
              Open Bracket
            </Link>
          </div>
        </header>

        {isCompleted && (
          <p className={styles.completedNote}>
            Tournament is completed. Teams are read-only.
          </p>
        )}

        {!isCompleted && (
          <form onSubmit={submitTeam} className={styles.form}>
            <h2>Add Team</h2>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              className="form-control"
              placeholder="Team name"
            />
            <input
              value={imgUrl}
              onChange={(event) => setImgUrl(event.target.value)}
              className="form-control"
              placeholder="Image URL (optional)"
            />
            <button type="submit" className="btn btn-primary">
              Save team
            </button>
          </form>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.list}>
          <h2>Teams ({tournament.teams.length})</h2>
          {tournament.teams.length === 0 && <p>No teams yet.</p>}
          <ul>
            {tournament.teams.map((team) => {
              const isEditing = editingId === team.id;
              return (
                <li key={team.id} className={styles.item}>
                  {isEditing ? (
                    <>
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="form-control"
                        placeholder="Team name"
                      />
                      <input
                        value={editImgUrl}
                        onChange={(event) => setEditImgUrl(event.target.value)}
                        className="form-control"
                        placeholder="Image URL"
                      />
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => saveEdit(team)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.meta}>
                        <strong>{team.name}</strong>
                        {team.img_url ? (
                          <a href={team.img_url} target="_blank" rel="noreferrer">
                            image
                          </a>
                        ) : (
                          <small>no image</small>
                        )}
                      </div>
                      {!isCompleted && (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => startEdit(team)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteTeam(tournament.id, team.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </section>
    </main>
  );
};

export default AddTeams;
