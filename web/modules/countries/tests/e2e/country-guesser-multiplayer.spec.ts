import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";
import {
  clickRobustly,
  isolateRoomPerFile,
  joinLobby,
  submitName,
  testPerProject,
  waitForMapLoaded,
} from "../../../play/tests/e2e/helpers";

test.beforeEach(async ({ context }, testInfo) => {
  await isolateRoomPerFile(context, testInfo, "multiplayer");
});

// Both tests below join a "Marko" + "Steve" pair into this file's shared
// room (see isolateRoomPerFile) -- serialised so they can't both be
// mid-join at once, which otherwise races two concurrent "Marko"s into
// the same room.
test.describe("Country Guesser Multiplayer", () => {
  test.describe.configure({ mode: "serial" });

  // Same alphabetical-under-Playwright queue as the solo test, so
  // "Afghanistan", "Albania" and "Algeria" are always the first three
  // targets. Unlike solo, multiplayer guesses/skips carry no time
  // bonus/penalty (see game-room.ts), so there's no way to drain the
  // clock early -- the round length is set to the server's 1 minute
  // minimum. The round clock itself ticks faster under Playwright (see
  // PLAYWRIGHT_TICK_SPEEDUP in game-room.ts), so the game-over wait
  // below is roughly 1/4 of that, not a genuine 1 minute.
  testPerProject(
    "plays a multiplayer round from an invite link through to game over, and back to the lobby",
    async ({ page, context, browser }, testInfo) => {
      test.setTimeout(90000);

      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Marko");
      await page.getByRole("button", { name: "Copy Link" }).click();
      await expect(
        page.getByRole("button", { name: "Copied!" }),
      ).toBeVisible();
      const inviteUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );

      // Navigates straight to the invite URL and only fills in the name --
      // NOT joinLobby(), which starts by navigating to /countries and would
      // create (and land the guest in) a brand new room instead of Marko's.
      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();
      await guestPage.goto(inviteUrl);
      await submitName(guestPage, "Steve");

      // Host sees both players, the host badge, and the round-length
      // controls (a slider plus a linked numeric field) and Start Game.
      await expect(
        page.locator(".gamelobby-player-crown"),
      ).toBeVisible();
      await expect(
        page.locator(".gamelobby-player-name.highlight"),
      ).toHaveText("Marko");
      await expect(page.getByText("Steve")).toBeVisible();
      await expect(
        page.getByRole("slider", { name: "Game length (min)" }),
      ).toBeVisible();
      const roundLengthInput = page.getByRole("spinbutton");
      await expect(roundLengthInput).toBeVisible();
      const startGameButton = page.getByRole("button", {
        name: "Start Game",
      });
      await expect(startGameButton).toBeVisible();

      // The guest sees neither -- just a waiting message.
      await expect(
        guestPage.getByRole("button", { name: "Start Game" }),
      ).toBeHidden();
      await expect(
        guestPage.getByRole("slider", { name: "Game length (min)" }),
      ).toBeHidden();
      await expect(
        guestPage.getByText("Waiting for the host to start…"),
      ).toBeVisible();

      // Shortest possible round -- the server clamps below 1 minute anyway.
      await roundLengthInput.fill("1");
      await startGameButton.click();

      const hostGuessInput = page.getByRole("searchbox", {
        name: "Guess",
      });
      const hostGuessButton = page.getByRole("button", {
        name: "Guess",
      });
      const hostSkipButton = page.getByRole("button", {
        name: "Skip",
      });
      const guestGuessInput = guestPage.getByRole("searchbox", {
        name: "Guess",
      });
      const guestGuessButton = guestPage.getByRole("button", {
        name: "Guess",
      });
      const guestSkipButton = guestPage.getByRole("button", {
        name: "Skip",
      });

      await expect(hostGuessInput).toBeVisible();
      await expect(guestGuessInput).toBeVisible();
      await expect(page.locator(".scorebar-players")).toContainText(
        "Marko",
      );
      await expect(page.locator(".scorebar-players")).toContainText(
        "Steve",
      );

      // Unlike solo, multiplayer has no skip/guess time bonus/penalty to
      // drive the clock with (see the comment on this describe block) --
      // it only ever moves via the passive per-second tick, so how much
      // it had already ticked down by snapshot time varied with how long
      // map load and the assertions above happened to take (seen
      // anywhere from 48s to 53s left), which Chromatic then flagged as
      // a diff every run. Waiting for a fixed value pins it.
      await waitForMapLoaded(page);
      // A plain `expect(...).toHaveText("45")` isn't tight enough to
      // reliably catch this -- the clock ticks every 250ms (4x speed,
      // see PLAYWRIGHT_TICK_SPEEDUP) but that assertion's own retry
      // interval is coarser than that, so it was observed skipping
      // straight past 45 to 44 or lower between polls. waitForFunction's
      // default requestAnimationFrame-cadence polling is tight enough to
      // not miss it.
      await page.waitForFunction(
        () =>
          document
            .querySelector(".scorebar-timer")
            ?.textContent?.trim() === "45",
      );
      await takeSnapshot(
        page,
        "Country Guesser Multiplayer Gameplay",
        testInfo,
      );

      // Afghanistan: both guess correctly -- each scores points (100 down
      // to a floor of 20, 10 off per clue letter already revealed at
      // guess time; clues never auto-reveal under Playwright though, see
      // `clueIntervalSeconds` in game-room.ts, so this is always 100 here)
      // and the round only advances once both are done.
      await hostGuessInput.fill("Afghanistan");
      await clickRobustly(hostGuessButton);
      await expect(
        page.locator(".guesspanel-waiting-text"),
      ).toHaveText("Nice, you got it! Waiting for Steve…");
      await expect(guestGuessInput).toBeVisible();

      await guestGuessInput.fill("Afghanistan");
      await clickRobustly(guestGuessButton);
      await expect(hostGuessInput).toBeVisible();
      await expect(guestGuessInput).toBeVisible();

      // Marko's score is now final -- he only skips from here on.
      const markPoints = Number(
        await page
          .locator(".scorebar-player", { hasText: "Marko" })
          .locator(".scorebar-player-score")
          .innerText(),
      );
      expect(markPoints).toBeGreaterThanOrEqual(20);
      expect(markPoints).toBeLessThanOrEqual(100);

      // Albania: host skips (no score change for him), guest guesses.
      await clickRobustly(hostSkipButton);
      await expect(
        page.locator(".guesspanel-waiting-text"),
      ).toHaveText("Skipped. Waiting for Steve…");
      await guestGuessInput.fill("Albania");
      await clickRobustly(guestGuessButton);
      await expect(hostGuessInput).toBeVisible();
      await expect(guestGuessInput).toBeVisible();

      // Steve's score is now final (2 correct guesses combined).
      const stevePoints = Number(
        await page
          .locator(".scorebar-player", { hasText: "Steve" })
          .locator(".scorebar-player-score")
          .innerText(),
      );
      expect(stevePoints).toBeGreaterThanOrEqual(40);
      expect(stevePoints).toBeLessThanOrEqual(200);
      expect(stevePoints).toBeGreaterThan(markPoints);

      // Algeria: guest skips first this time, then host -- no score change
      // for either.
      await clickRobustly(guestSkipButton);
      await expect(
        guestPage.locator(".guesspanel-waiting-text"),
      ).toHaveText("Skipped. Waiting for Marko…");
      await clickRobustly(hostSkipButton);

      // Steve: 2 correct, 1 skip -- the higher score, so the winner. Marko:
      // 1 correct, 2 skips. The rest of the round plays out untouched
      // until the (accelerated, ~15s) clock ends it.
      const gameOverHeading = page.getByRole("heading", {
        name: "Game Over",
      });
      await expect(gameOverHeading).toBeVisible({ timeout: 45000 });
      await expect(
        guestPage.getByRole("heading", { name: "Game Over" }),
      ).toBeVisible();

      await expect(page.locator(".gameoverscreen-winner")).toHaveText(
        "Steve wins!",
      );
      const scores = page.locator(".gameoverscreen-score");
      await expect(scores).toHaveCount(2);
      await expect(scores.nth(0)).toContainText("Steve");
      await expect(scores.nth(0)).toContainText(
        "2 guessed, 1 skipped",
      );
      await expect(
        scores.nth(0).locator(".gameoverscreen-score-pts"),
      ).toHaveText(String(stevePoints));
      await expect(scores.nth(1)).toContainText("Marko");
      await expect(scores.nth(1)).toContainText(
        "1 guessed, 2 skipped",
      );
      await expect(
        scores.nth(1).locator(".gameoverscreen-score-pts"),
      ).toHaveText(String(markPoints));

      await takeSnapshot(
        page,
        "Country Guesser Multiplayer Game Over",
        testInfo,
      );

      // Only the host gets a "Back to Lobby" button on the game-over
      // screen -- guests see a waiting message instead (see
      // GameOverScreen.vue), though the host's click still sends
      // everyone back (see "return_to_lobby" in api/play/src/lobby-room.ts,
      // broadcast to every connected lobby session regardless of who
      // sent it).
      const backToLobbyButton = page
        .getByRole("main")
        .getByRole("button", { name: "Back to Lobby" });
      await expect(backToLobbyButton).toBeVisible();
      await expect(
        guestPage.getByText(
          "Waiting for the host to return to the lobby…",
        ),
      ).toBeVisible();

      await backToLobbyButton.click();
      await expect(startGameButton).toBeVisible();
      await expect(
        guestPage.getByText("Waiting for the host to start…"),
      ).toBeVisible();

      await guestContext.close();
    },
  );

  // Population order is sorted server-side (see queueForOrder in
  // game-room.ts) independently of the alphabetical-under-Playwright queue
  // the other test above relies on, and India is unambiguously the most
  // populous country in shared/countries.json -- so it's always the very
  // first target once this order is selected, regardless of environment.
  testPerProject(
    "orders the round by population when that order is selected",
    async ({ page, context, browser }) => {
      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Marko");
      await page.getByRole("button", { name: "Copy Link" }).click();
      await expect(
        page.getByRole("button", { name: "Copied!" }),
      ).toBeVisible();
      const inviteUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );

      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();
      await guestPage.goto(inviteUrl);
      await submitName(guestPage, "Steve");

      await page.getByLabel("Country order").click();
      await page.getByRole("option", { name: "Population" }).click();

      // A non-host player sees the host's live picks in plain text, but
      // can't edit them (see "update_settings" in game-room.ts, which
      // only ever accepts this from the host).
      await expect(
        guestPage.getByText("Game length: 5 min"),
      ).toBeVisible();
      await expect(
        guestPage.getByText("Country order: Population"),
      ).toBeVisible();
      await expect(
        guestPage.getByRole("combobox", { name: "Country order" }),
      ).toHaveCount(0);

      await page.getByRole("button", { name: "Start Game" }).click();

      const hostGuessInput = page.getByRole("searchbox", {
        name: "Guess",
      });
      await expect(hostGuessInput).toBeVisible();
      await hostGuessInput.fill("India");
      await clickRobustly(
        page.getByRole("button", { name: "Guess" }),
      );
      await expect(
        page.locator(".guesspanel-waiting-text"),
      ).toHaveText("Nice, you got it! Waiting for Steve…");

      await guestContext.close();
    },
  );
});
