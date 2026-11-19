export type Cell = 0 | 1 | 2;
export type Board = Cell[][];

export type GameStatus = "in_progress" | "win" | "draw";

export interface EvaluateResponse {
    valid: boolean;
    status?: GameStatus;
    current_player?: 1 | 2 | null;
    winner?: 1 | 2 | null;
    winning_cells?: [number, number][];
    error?: string;
}

// Relative URL: the Vite dev server proxies it to the backend (see vite.config.ts).
const API_URL = "/evaluate_board_state";

export async function evaluateBoard(board: Board): Promise<EvaluateResponse> {
    let res: Response;
    try {
        res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board }),
        });
    } catch {
        return { valid: false, error: "Could not reach the server" };
    }

    // A crashed server can answer with plain text, so do not assume JSON.
    let data: Partial<EvaluateResponse> | null = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        return { valid: false, error: data?.error ?? `Server error (${res.status})` };
    }
    if (!data) {
        return { valid: false, error: "Unexpected response from the server" };
    }
    return data as EvaluateResponse;
}
