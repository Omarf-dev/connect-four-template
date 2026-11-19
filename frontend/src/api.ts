export type Cell = 0 | 1 | 2;
export type Board = Cell[][];

export interface EvaluateResponse {
    valid: Boolean;
    status?: "in_progress" | "win" | "draw";
    current_player? : 1 | 2 | null;
    winner? : 1 | 2 | null;
    winning_cells? : [number, number][];
    error?: string; 
}

// Relative URL: the Vite dev server proxies it to the backend (see vite.config.ts).
const API_URL = "/evaluate_board_state";
export async function evaluateBoard(board: Board): Promise<EvaluateResponse> {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({board}),
        });
        const data = await res.json();
        if(!res.ok) return {valid: false, error: data.error ?? "Server Error"};
        return data as EvaluateResponse
    } catch (error) {
        return {valid: false, error: "Could not reach the server"};
    }
}