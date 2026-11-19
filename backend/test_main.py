import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

SYMBOLS = {".": 0, "B": 1, "R": 2}


def board_from_rows(*rows: str) -> list[list[int]]:
    """Build a board from text rows: '.' empty, 'B' blue, 'R' red. Top row first."""
    return [[SYMBOLS[ch] for ch in row] for row in rows]


def play(*columns: int) -> list[list[int]]:
    """Drop pieces alternately (blue first) into the given columns, with gravity."""
    board = [[0] * 7 for _ in range(6)]
    for i, col in enumerate(columns):
        player = 1 if i % 2 == 0 else 2
        row = next(r for r in range(5, -1, -1) if board[r][col] == 0)
        board[row][col] = player
    return board


def evaluate(board: list[list[int]]):
    return client.post("/evaluate_board_state", json={"board": board})


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_empty_board_is_in_progress_with_blue_to_move() -> None:
    response = evaluate(board_from_rows(*["......."] * 6))
    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "status": "in_progress",
        "current_player": 1,
        "winner": None,
        "winning_cells": [],
    }


def test_red_is_to_move_after_one_blue_move() -> None:
    body = evaluate(play(3)).json()
    assert body["status"] == "in_progress"
    assert body["current_player"] == 2


@pytest.mark.parametrize(
    ("columns", "winner", "cells"),
    [
        # Horizontal: blue fills the bottom row, columns 0-3.
        ([0, 0, 1, 1, 2, 2, 3], 1, [[5, 0], [5, 1], [5, 2], [5, 3]]),
        # Vertical: blue stacks column 0.
        ([0, 1, 0, 1, 0, 1, 0], 1, [[2, 0], [3, 0], [4, 0], [5, 0]]),
        # Diagonal (down-right).
        ([3, 2, 2, 1, 1, 0, 0, 0, 1, 6, 0], 1, [[2, 0], [3, 1], [4, 2], [5, 3]]),
        # Diagonal (down-left), mirror of the one above.
        ([3, 4, 4, 5, 5, 6, 6, 6, 5, 0, 6], 1, [[2, 6], [3, 5], [4, 4], [5, 3]]),
        # Red wins horizontally on the bottom row, columns 1-4.
        ([0, 1, 6, 2, 6, 3, 5, 4], 2, [[5, 1], [5, 2], [5, 3], [5, 4]]),
    ],
)
def test_wins_in_every_direction(columns, winner, cells) -> None:
    response = evaluate(play(*columns))
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "win"
    assert body["winner"] == winner
    assert body["current_player"] is None
    assert body["winning_cells"] == cells


def test_full_board_without_a_winner_is_a_draw() -> None:
    board = board_from_rows(
        "BBRRBBR",
        "RRBBRRB",
        "BBRRBBR",
        "RRBBRRB",
        "BBRRBBR",
        "RRBBRRB",
    )
    response = evaluate(board)
    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "status": "draw",
        "current_player": None,
        "winner": None,
        "winning_cells": [],
    }


def test_red_win_on_blues_turn_is_impossible() -> None:
    # Red has four in a row, but blue has one more piece, so red could not have moved last.
    board = board_from_rows(
        ".......",
        ".......",
        ".......",
        "......B",
        "......B",
        "BRRRRBB",
    )
    response = evaluate(board)
    assert response.status_code == 400
    assert response.json()["valid"] is False
    assert "red" in response.json()["error"]


def test_blue_win_on_reds_turn_is_impossible() -> None:
    # Blue has four in a row, but the counts are equal, so blue could not have moved last.
    board = board_from_rows(
        ".......",
        ".......",
        ".......",
        ".......",
        "......R",
        "BBBBRRR",
    )
    response = evaluate(board)
    assert response.status_code == 400
    assert response.json()["valid"] is False
    assert "blue" in response.json()["error"]


def test_both_players_winning_is_rejected() -> None:
    board = board_from_rows(
        ".......",
        ".......",
        "BR.....",
        "BR.....",
        "BR.....",
        "BR.....",
    )
    response = evaluate(board)
    assert response.status_code == 400
    assert response.json() == {"valid": False, "error": "both players cannot have won"}


def test_wrong_row_count_is_rejected() -> None:
    response = evaluate(board_from_rows(*["......."] * 5))
    assert response.status_code == 400
    assert response.json() == {"valid": False, "error": "board must have 6 rows"}


def test_unknown_cell_value_is_rejected() -> None:
    board = [[0] * 7 for _ in range(6)]
    board[5][0] = 3
    response = evaluate(board)
    assert response.status_code == 400
    assert response.json()["valid"] is False


def test_floating_chip_is_rejected() -> None:
    board = board_from_rows("B......", ".......", ".......", ".......", ".......", ".......")
    response = evaluate(board)
    assert response.status_code == 400
    assert "floating" in response.json()["error"]


def test_wrong_piece_counts_are_rejected() -> None:
    # Two blue pieces and no red: blue cannot have moved twice in a row.
    response = evaluate(board_from_rows(*["......."] * 5, "BB....."))
    assert response.status_code == 400
    assert "piece counts" in response.json()["error"]


def test_malformed_body_is_rejected() -> None:
    response = client.post("/evaluate_board_state", json={"board": "nope"})
    assert response.status_code == 422
