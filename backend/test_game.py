from game import find_winning_lines, winning_cells


def empty_board() -> list[list[int]]:
    return [[0] * 7 for _ in range(6)]


def test_every_winning_line_is_highlighted() -> None:
    # Blue has a horizontal line on the bottom row and a vertical line in column 0.
    board = empty_board()
    for c in range(4):
        board[5][c] = 1
    for r in (2, 3, 4):
        board[r][0] = 1

    lines = find_winning_lines(board)
    assert len(lines[1]) == 2

    assert winning_cells(lines[1]) == [
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [5, 1],
        [5, 2],
        [5, 3],
    ]
