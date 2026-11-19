import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import App from "./App";

type MockResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

function stubFetch(response: MockResponse) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => response as unknown as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200): MockResponse {
  return { ok: status < 400, status, json: async () => body };
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("renders the title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Connect Four" })).toBeInTheDocument();
  });

  test("posts the board to the relative API URL and shows the winner", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
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
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Drop in column 1" }));

    expect(await screen.findByRole("heading", { name: "BLUE wins!" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/evaluate_board_state");
    const sent = JSON.parse(init?.body as string);
    expect(sent.board[5][0]).toBe(1);
  });

  test("shows a draw when the backend reports one", async () => {
    stubFetch(jsonResponse({ valid: true, status: "draw", current_player: null, winner: null, winning_cells: [] }));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Drop in column 1" }));

    expect(await screen.findByRole("heading", { name: "Game Draw!" })).toBeInTheDocument();
  });

  test("shows the backend's rule error", async () => {
    stubFetch(jsonResponse({ valid: false, error: "red has won, but red did not make the last move" }, 400));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Drop in column 1" }));

    expect(await screen.findByText("red has won, but red did not make the last move")).toBeInTheDocument();
  });

  test("shows the status code when the server fails with a non-JSON body", async () => {
    stubFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected token I in JSON");
      },
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Drop in column 1" }));

    expect(await screen.findByText("Server error (500)")).toBeInTheDocument();
  });
});
