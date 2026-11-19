from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from game import InvalidBoard, evaluate_board
from schemas import ErrorResponse, EvaluateRequest, GameState

app = FastAPI(title="Connect Four")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def bad_request(message: str) -> JSONResponse:
    return JSONResponse(status_code=400, content=ErrorResponse(error=message).model_dump())


@app.exception_handler(RequestValidationError)
def handle_malformed_body(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Same error shape as rule violations, so the frontend can show it.
    details = "; ".join(
        f"{'.'.join(str(part) for part in err['loc'][1:]) or 'body'}: {err['msg']}"
        for err in exc.errors()
    )
    return bad_request(f"malformed request: {details}")


@app.post(
    "/evaluate_board_state",
    response_model=GameState,
    responses={400: {"model": ErrorResponse, "description": "The board breaks the rules."}},
)
def evaluate_board_state(request: EvaluateRequest) -> GameState | JSONResponse:
    try:
        return evaluate_board(request.board)
    except InvalidBoard as exc:
        return bad_request(str(exc))
