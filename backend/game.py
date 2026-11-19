"""Connect Four rules: validate a board and evaluate its state.

Nothing in this module knows about HTTP. The route layer in main.py turns
InvalidBoard into a 400 response.
"""

from typing import Any

ROWS = 6
COLS = 7
EMPTY, BLUE, RED = 0, 1, 2
# Directions to scan from each cell: right, down, down-right, down-left.
# Every four-in-a-row is found from its first cell in one of these directions.
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (1, -1)]


class InvalidBoard(ValueError):
    """Raised when a board breaks the rules. The message is shown to the user."""


def validate_board(board: list[list[int]]) -> None:
    if len(board) != ROWS:
        raise InvalidBoard(f"board must have {ROWS} rows")
    for row in board:
        if len(row) != COLS:
            raise InvalidBoard(f"each row must have {COLS} columns")
        for cell in row:
            if cell not in (EMPTY, BLUE, RED):
                raise InvalidBoard("cells must be 0 (empty), 1 (blue), or 2 (red)")

    # Gravity: no chip may sit above an empty slot in its column.
    for c in range(COLS):
        seen_empty = False
        for r in range(ROWS - 1, -1, -1):
            if board[r][c] == EMPTY:
                seen_empty = True
            elif seen_empty:
                raise InvalidBoard(f"column {c + 1} has a chip floating above an empty slot")

    blue, red = count_pieces(board)
    if not (blue == red or blue == red + 1):
        raise InvalidBoard("invalid piece counts: blue must go first and players must alternate")


def count_pieces(board: list[list[int]]) -> tuple[int, int]:
    blue = sum(row.count(BLUE) for row in board)
    red = sum(row.count(RED) for row in board)
    return blue, red


def find_winning_lines(board: list[list[int]]) -> dict[int, list[list[tuple[int, int]]]]:
    """Map each player to every four-in-a-row line they have on the board."""
    lines: dict[int, list[list[tuple[int, int]]]] = {}
    for r in range(ROWS):
        for c in range(COLS):
            player = board[r][c]
            if player == EMPTY:
                continue
            for dr, dc in DIRECTIONS:
                cells = [(r + i * dr, c + i * dc) for i in range(4)]
                if all(
                    0 <= rr < ROWS and 0 <= cc < COLS and board[rr][cc] == player
                    for rr, cc in cells
                ):
                    lines.setdefault(player, []).append(cells)
    return lines


def winning_cells(lines: list[list[tuple[int, int]]]) -> list[list[int]]:
    """Every cell that is part of any winning line, in reading order."""
    cells = {cell for line in lines for cell in line}
    return [[r, c] for r, c in sorted(cells)]


def evaluate_board(board: list[list[int]]) -> dict[str, Any]:
    """Validate a board and describe its state. Raises InvalidBoard if it breaks the rules."""
    validate_board(board)

    lines = find_winning_lines(board)
    if len(lines) == 2:
        raise InvalidBoard("both players cannot have won")

    blue, red = count_pieces(board)

    # Blue moves first, so after a blue move blue has one more piece than red,
    # and after a red move the counts are equal. The winner must have moved last.
    if BLUE in lines and blue != red + 1:
        raise InvalidBoard("blue has won, but blue did not make the last move")
    if RED in lines and blue != red:
        raise InvalidBoard("red has won, but red did not make the last move")

    if lines:
        winner, winner_lines = next(iter(lines.items()))
        return {
            "valid": True,
            "status": "win",
            "current_player": None,
            "winner": winner,
            "winning_cells": winning_cells(winner_lines),
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
