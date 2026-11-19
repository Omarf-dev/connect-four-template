import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renders the title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Connect Four" })).toBeInTheDocument();
});

test("posts the board to the relative API URL and shows the winner", async () => {
  const fetchMock = vi.fn(
    async (_url: string, _init?: RequestInit) =>
      ({
        ok: true,
        json: async () => ({
          valid: true,
          status: "win",
          current_player: null,
          winner: 1,
          winning_cells: [
            [5, 0],
            [5, 1],
            [5, 2],
            [5, 3],
          ],
        }),
      }) as unknown as Response,
  );
  vi.stubGlobal("fetch", fetchMock);

  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Drop in column 1" }));

  expect(await screen.findByRole("heading", { name: "BLUE wins!" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/evaluate_board_state");
  const sent = JSON.parse(init?.body as string);
  expect(sent.board[5][0]).toBe(1);
});
