# Next steps

What I would do with more time, in priority order. Items marked **open** are known gaps in the current code, not wishes.

## Open: verify before anything else

- **Browser tests have not passed yet.** `frontend/e2e/game.spec.ts` has seven Playwright tests. A stale backend from an older version was holding port 8080, so the run stopped. Stop that process, rerun `npm run test:e2e` on Node 24, and fix anything it finds. The config no longer reuses a server it did not start, so a stale backend now fails the run loudly.
- **Full test pass from a clean clone.** Run `pytest`, `npm test`, `npm run build` and `npm run test:e2e` from a fresh clone, to check that nothing depends on files only present on this machine.

## Open: the org's README

The org's README asks for a short section on how to run the app and its tests. The current README does not have one, and it still says Node 20, which conflicts with the Node 24 requirement in `frontend/package.json`. I left the README alone because it was provided by the org. The run instructions and the Node version need to be decided with them.

## Correctness and contract

- **Share the response types with the frontend.** The backend publishes its response schema through FastAPI's OpenAPI document, but the frontend's types in `frontend/src/api.ts` are still written by hand. Generating them from `/openapi.json` would stop the two drifting apart again.
- **Stateless rule limits.** The API only sees the board, not the move order. It can catch impossible boards by counting pieces, but it cannot tell whether someone kept playing after a win. If the rules need to be enforced exactly, the client would have to send the move history, which is a bigger API change. This is a trade-off to discuss, not a bug to quietly fix.
- **Several winning lines for one player.** A valid board can contain two separate winning lines for the same player. The response reports one winner and highlights every cell in every winning line. That is intended, but no test pins it down yet, so a regression would go unnoticed.

## Testing

- **Run the browser tests in CI.** Right now they only run on a developer's machine. A GitHub Actions workflow with Node 24, Python 3.13 and Chromium would catch regressions on every push.
- **Test the Python package boundaries.** `game.py` is pure logic and has direct tests. The HTTP layer is covered only through the API tests. That is probably enough for this size of app.
- **Accessibility audit.** The board uses `role="button"` on each column, which works for keyboard and screen readers. A proper audit (for example with axe in the Playwright tests) would catch contrast and labelling issues I have not checked.

## Architecture and infrastructure

- **Lock the Node and Python toolchains.** `package.json` requires Node 24 and `requirements.txt` pins exact versions. A `.nvmrc` or `.python-version` file would make that choice visible to whoever runs the project next.
- **A single command to start both servers.** Right now the backend and frontend run in two terminals. Vite's proxy already points at the backend, so a `concurrently` script or a small `Makefile` would make local runs simpler.
- **Persistence and multiplayer.** The game is local and lost on refresh, which the brief allows. Saving the board in `localStorage` would be a small change, and a shared game over a WebSocket would be a larger one. Both are product decisions, not engineering ones.

## UI

- **Dark mode.** The colours live in CSS custom properties in `App.css`, so a dark theme is mostly a second set of values.
- **Animation for dropped chips.** A short fall animation would make each move easier to follow. The current UI updates instantly.
- **Mobile check.** The board sizes itself with a viewport-based cell size, but I have not tested it on a real phone.

## Process

- **Keep the AI transcript current.** `ai-transcripts/01-review-and-fixes.md` covers the session up to the request for `NEXT_STEPS.md`. It was built from the session log, so it leaves out tool output and hidden reasoning. The README asks for every prompt and response, so before submitting, replace it with the `/export` output for the full session, or check with the org that the shorter form is acceptable. Later sessions go in as `02-…`, `03-…`.
