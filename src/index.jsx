import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import { uid } from "uid";
import App from "./App";
import { TOURNAMENT_MODE_SINGLE } from "./Constants";
import { rootReducer } from "./reducers";
import reportWebVitals from "./reportWebVitals";

const loggerMiddleware = createLogger();
const STORAGE_KEY = "tournament_brackets_state";
const LEGACY_TEAMS_KEY = "tournament_brackets_teams";

const normalizeTournament = (item) => {
  if (!item || !item.id || !Array.isArray(item.teams)) {
    return null;
  }

  return {
    id: item.id,
    name: item.name || "Tournament",
    mode: item.mode || TOURNAMENT_MODE_SINGLE,
    teams: item.teams,
    bracketTeamIds: Array.isArray(item.bracketTeamIds)
      ? item.bracketTeamIds
      : null,
    groupTeamIds: Array.isArray(item.groupTeamIds) ? item.groupTeamIds : null,
    winnerSelections: item.winnerSelections || {},
    matchResults: item.matchResults || {},
    championId: item.championId || null,
    completedAt: item.completedAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

const loadPreloadedState = () => {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (rawState) {
      const parsed = JSON.parse(rawState);
      if (parsed && Array.isArray(parsed.tournaments)) {
        const tournaments = parsed.tournaments.map(normalizeTournament).filter(Boolean);
        return { tournaments };
      }
    }

    const legacyRawTeams = localStorage.getItem(LEGACY_TEAMS_KEY);
    if (legacyRawTeams) {
      const teams = JSON.parse(legacyRawTeams);
      if (Array.isArray(teams) && teams.length > 0) {
        return {
          tournaments: [
            {
              id: uid(),
              name: "Imported tournament",
              mode: TOURNAMENT_MODE_SINGLE,
              teams,
              bracketTeamIds: null,
              groupTeamIds: null,
              winnerSelections: {},
              matchResults: {},
              championId: null,
              completedAt: null,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
};

const middlewares = process.env.NODE_ENV === "development" ? [loggerMiddleware] : [];
const store = createStore(
  rootReducer,
  loadPreloadedState(),
  applyMiddleware(...middlewares)
);

store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()));
  } catch (error) {
    // Ignore storage quota and browser privacy mode errors.
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
reportWebVitals();
