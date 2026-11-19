import { useRef, useState } from "react";
import BoardComp from "./components/Board";
import {
  evaluateBoard,
  type Board as BoardType,
  type Cell,
  type EvaluateResponse,
} from "./api";

const ROWS = 6;
const COLS = 7;
const emptyBoard = (): BoardType =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
const NAMES: Record<number, string> = { 1: "BLUE", 2: "RED" };

export default function App() {
  const [board, setBoard] = useState<BoardType>(emptyBoard);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A ref, not state: a second click in the same tick must see the lock at once.
  const pending = useRef(false);
  // Bumped on reset so a reply to an old game cannot overwrite the new one.
  const gameId = useRef(0);

  const gameOver = result?.status === "win" || result?.status === "draw";
  const currentPlayer = result?.current_player ?? 1;

  async function handleColumnClick(col: number) {
    if (pending.current || gameOver || board[0][col]) return;

    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === 0) {
        row = r;
        break;
      }
    }

    const next = board.map((r) => [...r]) as BoardType;
    next[row][col] = currentPlayer as Cell;

    const thisGame = gameId.current;
    pending.current = true;
    setBusy(true);
    const res = await evaluateBoard(next);
    pending.current = false;
    setBusy(false);

    if (thisGame !== gameId.current) return;

    if (res.valid) {
      setBoard(next);
      setResult(res);
      setError(null);
    } else {
      setError(res.error ?? "Invalid move");
    }
  }

  function reset() {
    gameId.current += 1;
    setBoard(emptyBoard());
    setResult(null);
    setError(null);
  }

  let message: string;
  if (result?.status === "win" && result.winner) {
    message = `${NAMES[result.winner]} wins!`;
  } else if (result?.status === "draw") {
    message = "Game Draw!";
  } else {
    message = `${NAMES[currentPlayer]} turn!`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Connect Four</h1>
      <h2>{message}</h2>
      <BoardComp
        board={board}
        winningCells={result?.winning_cells ?? []}
        disabled={busy || gameOver}
        onColumnClick={handleColumnClick}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={reset}>Reset</button>
    </div>
  );
}
