import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Bracket from "./Bracket";

const teams = [
  { id: "a", name: "Team A" },
  { id: "b", name: "Team B" },
  { id: "c", name: "Team C" },
  { id: "d", name: "Team D" },
];

const renderBracketRoute = (tournament, props = {}) =>
  render(
    <MemoryRouter initialEntries={["/tournament/t-1/bracket"]}>
      <Routes>
        <Route
          path="/tournament/:tournamentId/bracket"
          element={
            <Bracket
              tournaments={[tournament]}
              setMatchWinner={jest.fn()}
              resetTournamentBracket={jest.fn()}
              generateTournamentBracket={jest.fn()}
              {...props}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("Bracket", () => {
  it("shows generate button before bracket generation and triggers action", () => {
    const generateTournamentBracket = jest.fn();

    renderBracketRoute(
      {
        id: "t-1",
        name: "Summer Cup",
        teams,
        bracketTeamIds: null,
        winnerSelections: {},
        championId: null,
        completedAt: null,
      },
      { generateTournamentBracket }
    );

    expect(screen.getByText("Bracket is not generated yet.")).toBeInTheDocument();
    expect(screen.queryByText("Round of 4")).not.toBeInTheDocument();

    userEvent.click(screen.getByRole("button", { name: /Generate Bracket/i }));
    expect(generateTournamentBracket).toHaveBeenCalledWith("t-1", {
      seedingStrategy: "random",
    });
  });

  it("renders rounds when bracket already generated", () => {
    renderBracketRoute({
      id: "t-1",
      name: "Summer Cup",
      teams,
      bracketTeamIds: ["a", "b", "c", "d"],
      winnerSelections: {},
      championId: null,
      completedAt: null,
    });

    expect(screen.queryByText("Bracket is not generated yet.")).not.toBeInTheDocument();
    expect(screen.getByText("Semi-finals")).toBeInTheDocument();
  });
});
