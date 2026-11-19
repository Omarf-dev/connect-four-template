import type { KeyboardEvent } from "react";
import type { Board as BoardType, Cell } from "../api";

interface Props {
    board: BoardType;
    winningCells: [number, number][];
    disabled: boolean;
    onColumnClick: (col: number) => void;
}

const COLORS: Record<Cell, string> = {
    0: "#f8fafc",
    1: "#2563eb",
    2: "#dc2626",
};

export default function BoardComp({ board, winningCells, disabled, onColumnClick }: Props) {
    const isWinning = (r: number, c: number) =>
        winningCells.some(([wr, wc]) => wr === r && wc === c);

    const handleKey = (event: KeyboardEvent, col: number) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) onColumnClick(col);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                background: "#1e3a8a",
                padding: 12,
                borderRadius: 12,
                width: "fit-content",
            }}
        >
            {Array.from({ length: board[0].length }, (_, c) => (
                <div
                    key={c}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`Drop in column ${c + 1}`}
                    aria-disabled={disabled}
                    onClick={() => !disabled && onColumnClick(c)}
                    onKeyDown={(event) => handleKey(event, c)}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                >
                    {board.map((row, r) => (
                        <div
                            key={r}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                background: COLORS[row[c]],
                                outline: isWinning(r, c) ? "4px solid #facc15" : "none",
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
