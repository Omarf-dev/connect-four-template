import {useState} from "react";
import BoardComp from "./components/Board";
import{
  evaluateBoard,
  type Board as BoardType,
  type Cell,
  type EvaluateResponse,
} from "./api";

const emptyBoard = ():BoardType => Array.from({length: 6}, () => Array<Cell>(7).fill(0));
const NAMES: Record<number, string> = {1: "BLUE", 2: "RED"};

export default function App() {
  const [board, setBoard] = useState<BoardType>(emptyBoard);
  const [result, setResult ] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  
  const gameOver = result?.status === "win" || result?.status === "draw";
  const currentPlayer = result?.current_player ?? 1;

  async function handleColumnClick(col: number){
    if(busy || gameOver || board[0][col]) return;
    let row = -1;
    for(let r = board.length -1; r >= 0; r--){
      if(board[r][col] === 0){
        row = r;
        break;
      }
    }

    const next = board.map((r) => [...r]) as BoardType;
    next[row][col] = currentPlayer as Cell;

    setBusy(true);
    const res = await evaluateBoard(next);
    setBusy(false);

    if(res.valid){
      setBoard(next);
      setResult(res);
      setError(null);
    } else {
      setError(res.error ?? "Invalid move");
    }
  }

  function reset(){
    setBoard(emptyBoard());
    setResult(null);
    setError(null);
  }

  let message: string;
  if(result?.status === "win" && result.winner){
    message = `${NAMES[result.winner]} wins!`
  }else if(result?.status === "draw"){
    message = `Game Draw!`
  }else{
    message = `${NAMES[currentPlayer]} turn!`
  }
  
  return (
    <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}
    >
      <h1>Connect Four</h1>
      <h2>{message}</h2>
      <BoardComp
       board={board}
       winningCells= {result?.winning_cells ?? [] }
       disabled={busy || gameOver}
        onColumnClick={handleColumnClick}
       />
       {error && <p style={{color: "red"}}>{error}</p>}
       <button onClick={reset}>Reset</button>
    </div>
  );
}
