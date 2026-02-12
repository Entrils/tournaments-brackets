import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";

const baseTournament = {
  id: "t-1",
  name: "Summer Cup",
  teams: [{ id: "a", name: "Team A" }],
  championId: null,
  completedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("Home", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not delete tournament when confirm is canceled", () => {
    const deleteTournament = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <MemoryRouter>
        <Home
          tournaments={[baseTournament]}
          createTournament={jest.fn()}
          deleteTournament={deleteTournament}
        />
      </MemoryRouter>
    );

    userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteTournament).not.toHaveBeenCalled();
  });

  it("deletes tournament when confirm is accepted", () => {
    const deleteTournament = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <Home
          tournaments={[baseTournament]}
          createTournament={jest.fn()}
          deleteTournament={deleteTournament}
        />
      </MemoryRouter>
    );

    userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteTournament).toHaveBeenCalledWith("t-1");
  });
});
