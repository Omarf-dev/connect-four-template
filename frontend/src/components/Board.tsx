import type { KeyboardEvent } from "react";
import type { Board as BoardType, Cell } from "../api";

type Player = 1 | 2;

interface Props {
    board: BoardType;
    winningCells: [number, number][];
    lastMove: [number, number] | null;
    turn: Player;
    disabled: boolean;
    hoverCol: number | null;
    onHoverColumn: (col: number | null) => void;
    onColumnClick: (col: number) => void;
}

const PLAYER_CLASS: Record<Cell, string> = {
    0: "",
    1: "slot--blue",
    2: "slot--red",
};

// The lowest empty slot in a column, or -1 if the column is full.
function landingRow(board: BoardType, col: number): number {
    for (let r = board.length - 1; r >= 0; r--) {
        if (board[r][col] === 0) return r;
    }
    return -1;
}

export default function BoardComp({
    board,
    winningCells,
    lastMove,
    turn,
    disabled,
    hoverCol,
    onHoverColumn,
    onColumnClick,
}: Props) {
    const isWinning = (r: number, c: number) =>
        winningCells.some(([wr, wc]) => wr === r && wc === c);
    const isLast = (r: number, c: number) =>
        lastMove !== null && lastMove[0] === r && lastMove[1] === c;

    const handleKey = (event: KeyboardEvent, col: number, off: boolean) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!off) onColumnClick(col);
        }
    };

    return (
        <div className="board" role="group" aria-label="Connect Four board">
            {board[0].map((_, c) => {
                const full = board[0][c] !== 0;
                const off = disabled || full;
                const landing = off ? -1 : landingRow(board, c);

                return (
                    <div
                        key={c}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-label={full ? `Column ${c + 1} is full` : `Drop in column ${c + 1}`}
                        aria-disabled={off}
                        className={off ? "column column--off" : "column"}
                        onClick={() => !off && onColumnClick(c)}
                        onKeyDown={(event) => handleKey(event, c, off)}
                        onMouseEnter={() => onHoverColumn(c)}
                        onMouseLeave={() => onHoverColumn(null)}
                        onFocus={() => onHoverColumn(c)}
                        onBlur={() => onHoverColumn(null)}
                    >
                        {board.map((row, r) => {
                            const player = row[c];
                            const showGhost = player === 0 && r === landing && hoverCol === c;
                            const classes = ["slot"];
                            if (player !== 0) classes.push(PLAYER_CLASS[player]);
                            if (showGhost) classes.push(turn === 1 ? "slot--blue" : "slot--red", "slot--ghost");
                            if (isLast(r, c)) classes.push("slot--last");
                            if (isWinning(r, c)) classes.push("slot--win");
                            return <div key={r} className={classes.join(" ")} />;
                        })}
                    </div>
                );
            })}
        </div>
    );
}
