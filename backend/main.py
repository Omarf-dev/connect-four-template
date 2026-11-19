from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

ROWS = 6
COLS = 7
EMPTY, BLUE, RED = 0, 1, 2
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (1, -1)]

app = FastAPI(title="Connect Four")


class EvaluateRequest(BaseModel):
    board: list[list[int]]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def validate_board(board: list[list[int]]) -> str | None:
    if len(board) != ROWS:
        return f"board must have {ROWS} rows"
    for row in board:
        if len(row) != COLS:
            return f"each row must have {COLS} columns"
        for cell in row:
            if cell not in (EMPTY, BLUE, RED):
                return "cells must be 0 (empty), 1 (blue), or 2 (red)"

    for c in range(COLS):
        seen_empty = False
        for r in range(ROWS - 1, -1, -1):
            if board[r][c] == EMPTY:
                seen_empty = True
            elif seen_empty:
                return f"column {c + 1} has a chip floating above an empty slot"

    blue = sum(row.count(BLUE) for row in board)
    red = sum(row.count(RED) for row in board)

    if not (blue == red or blue == red + 1):
        return "invalid piece counts: blue must go first and players must alternate"
    return None


def find_wins(board: list[list[int]]) -> dict[int, list[tuple[int, int]]]:
    wins: dict[int, list[tuple[int, int]]] = {}

    for r in range(ROWS):
        for c in range(COLS):
            player = board[r][c]
            if player == EMPTY or player in wins:
                continue
            for dr, dc in DIRECTIONS:
                cells = [(r + i * dr, c + i * dc) for i in range(4)]
                if all(
                    0 <= rr < ROWS and 0 <= cc < COLS and board[rr][cc] == player
                    for rr, cc in cells
                ):
                    wins[player] = cells
                    break

    return wins


def reject(message: str) -> JSONResponse:
    return JSONResponse(status_code=400, content={"valid": False, "error": message})


@app.post("/evaluate_board_state")
def evaluate_board_state(request: EvaluateRequest):
    board = request.board

    error = validate_board(board)
    if error:
        return reject(error)

    wins = find_wins(board)
    if len(wins) == 2:
        return reject("both players cannot have won")

    blue = sum(row.count(BLUE) for row in board)
    red = sum(row.count(RED) for row in board)

    # Blue moves first, so after a blue move blue has one more piece than red,
    # and after a red move the counts are equal. The winner must have moved last.
    if BLUE in wins and blue != red + 1:
        return reject("blue has won, but blue did not make the last move")
    if RED in wins and blue != red:
        return reject("red has won, but red did not make the last move")

    if wins:
        winner, cells = next(iter(wins.items()))
        return {
            "valid": True,
            "status": "win",
            "current_player": None,
            "winner": winner,
            "winning_cells": [list(cell) for cell in cells],
        }

    if all(cell != EMPTY for row in board for cell in row):
        return {
            "valid": True,
            "status": "draw",
            "current_player": None,
            "winner": None,
            "winning_cells": [],
        }

    return {
        "valid": True,
        "status": "in_progress",
        "current_player": BLUE if blue == red else RED,
        "winner": None,
        "winning_cells": [],
    }
