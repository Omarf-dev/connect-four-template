"""Request and response models for the API. These define the JSON contract the frontend relies on."""

from typing import Literal

from pydantic import BaseModel, Field

Player = Literal[1, 2]
Status = Literal["in_progress", "win", "draw"]


class EvaluateRequest(BaseModel):
    board: list[list[int]] = Field(description="6 rows of 7 cells: 0 empty, 1 blue, 2 red.")


class GameState(BaseModel):
    """A valid board's state. Returned with HTTP 200."""

    valid: Literal[True] = True
    status: Status
    current_player: Player | None = Field(description="Whose turn it is; null once the game is over.")
    winner: Player | None = None
    winning_cells: list[tuple[int, int]] = Field(
        default_factory=list,
        description="[row, col] of every chip in a winning line; empty unless status is win.",
    )


class ErrorResponse(BaseModel):
    """A rejected board or malformed request. Returned with HTTP 400."""

    valid: Literal[False] = False
    error: str
