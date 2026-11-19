import { expect, test, type Page } from "@playwright/test";

// Chips on the board (not the turn dot, not the hover preview).
const PIECES = ".board .slot--blue:not(.slot--ghost), .board .slot--red:not(.slot--ghost)";

// Columns are 1-based, matching the aria-labels the user sees.
async function drop(page: Page, column: number) {
  const before = await page.locator(PIECES).count();
  await page.getByRole("button", { name: `Drop in column ${column}` }).click();
  // Wait for the move to land before the next click, so no click is lost to the pending check.
  await expect(page.locator(PIECES)).toHaveCount(before + 1);
}

async function playColumns(page: Page, columns: number[]) {
  for (const column of columns) {
    await drop(page, column);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BLUE to play" })).toBeVisible();
});

test("blue wins a row, the winning chips are highlighted, and the board locks", async ({ page }) => {
  // Blue fills columns 1-4 of the bottom row; red stacks on top of 1-3.
  await playColumns(page, [1, 1, 2, 2, 3, 3, 4]);

  await expect(page.getByRole("heading", { name: "BLUE wins!" })).toBeVisible();
  await expect(page.locator(".slot--win")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Drop in column 5" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
});

test("the turn alternates and a hover preview shows where the next chip lands", async ({ page }) => {
  await page.getByRole("button", { name: "Drop in column 4" }).hover();
  await expect(page.locator(".slot--ghost")).toHaveCount(1);
  await expect(page.locator(".slot--ghost.slot--blue")).toHaveCount(1);

  await drop(page, 4);
  await expect(page.getByRole("heading", { name: "RED to play" })).toBeVisible();
  await page.getByRole("button", { name: "Drop in column 4" }).hover();
  await expect(page.locator(".slot--ghost.slot--red")).toHaveCount(1);
});

test("a full column refuses further moves", async ({ page }) => {
  // Six alternating moves in one column fill it without a win.
  await playColumns(page, [1, 1, 1, 1, 1, 1]);

  const full = page.getByRole("button", { name: "Column 1 is full" });
  await expect(full).toHaveAttribute("aria-disabled", "true");
  await full.click({ force: true });
  await expect(page.getByRole("heading", { name: "BLUE to play" })).toBeVisible();
  await expect(page.locator(PIECES)).toHaveCount(6);
});

test("a full board with no winner is a draw", async ({ page }) => {
  // Move order that fills the board with no four-in-a-row for either colour.
  const drawOrder = [
    3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 7, 5, 5, 5, 5, 5, 5,
    6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7,
  ];
  await playColumns(page, drawOrder);

  await expect(page.getByRole("heading", { name: "Game Draw!" })).toBeVisible();
  await expect(page.locator(".slot--win")).toHaveCount(0);
});

test("an unreachable server shows an error and keeps the board", async ({ page }) => {
  await page.route("**/evaluate_board_state", (route) => route.abort());

  await page.getByRole("button", { name: "Drop in column 1" }).click();

  await expect(page.getByRole("alert")).toHaveText("Could not reach the server");
  await expect(page.getByRole("heading", { name: "BLUE to play" })).toBeVisible();
  await expect(page.locator(PIECES)).toHaveCount(0);
});

test("a server error without JSON shows the status code", async ({ page }) => {
  await page.route("**/evaluate_board_state", (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "Internal Server Error" }),
  );

  await page.getByRole("button", { name: "Drop in column 1" }).click();

  await expect(page.getByRole("alert")).toHaveText("Server error (500)");
});

test("reset clears the board and starts a new game", async ({ page }) => {
  await playColumns(page, [1, 2]);
  await page.getByRole("button", { name: "Reset" }).click();

  await expect(page.getByRole("heading", { name: "BLUE to play" })).toBeVisible();
  await expect(page.locator(PIECES)).toHaveCount(0);
});
