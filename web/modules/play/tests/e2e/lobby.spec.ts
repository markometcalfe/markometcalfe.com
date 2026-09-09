import {
  test,
  expect,
  takeSnapshot,
} from "@chromatic-com/playwright";
import {
  isolateRoomPerFile,
  joinLobby,
  submitName,
  testPerProject,
} from "./helpers";

test.beforeEach(async ({ context }, testInfo) => {
  await isolateRoomPerFile(context, testInfo, "lobby");
});

test.describe("Game Lobby", () => {
  test.describe.configure({ mode: "serial" });

  testPerProject(
    "shows the name prompt modal, rejects an offensive name, then joins",
    async ({ page }, testInfo) => {
      await page.goto("/play");
      await expect(page).toHaveURL(/\/play\/abc123(-[\w-]+)?$/, {
        timeout: 15000,
      });

      await expect(
        page.getByRole("heading", { name: "Enter your name" }),
      ).toBeVisible();
      const nameInput = page.getByRole("searchbox", {
        name: "Your name",
      });
      await expect(page.getByText("Your name...")).toBeVisible();
      const joinButton = page.getByRole("button", { name: "Join" });
      await expect(joinButton).toBeDisabled();

      await takeSnapshot(page, "Game Lobby Name Prompt", testInfo);

      await nameInput.fill("fuck");
      await expect(joinButton).toBeEnabled();
      await joinButton.click();
      await expect(
        page.getByText("This name cannot be used"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Enter your name" }),
      ).toBeVisible();

      await nameInput.fill("Alex");
      await joinButton.click();
      await expect(
        page.getByRole("heading", { name: "Enter your name" }),
      ).toBeHidden();
    },
  );

  testPerProject(
    "creates a room from the hub and shows the lobby with Country Guesser selected by default",
    async ({ page }, testInfo) => {
      await joinLobby(page, "Alex");

      await expect(
        page.getByRole("heading", { name: "Games" }),
      ).toBeVisible();
      await expect(page.getByText("Invite Others")).toBeVisible();

      await expect(
        page.locator(".gamepickerbutton", {
          hasText: "Country Guesser",
        }),
      ).toHaveClass(/gamepickerbutton-selected/);

      await takeSnapshot(page, "Game Lobby", testInfo);
    },
  );

  testPerProject(
    "shows the header and leaves back to the homepage",
    async ({ page }) => {
      await joinLobby(page, "Alex");

      // GameLobby.vue passes hide-title -- the page already has its own
      // "Games" <h1> in main (see the test above), so the header's own
      // title would just be a redundant repeat of it.
      await expect(page.locator(".headerbar-title")).toHaveCount(0);

      const backLink = page.getByRole("link", { name: "Leave" });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", "/");

      await backLink.click();
      await expect(page).toHaveURL("/");
    },
  );

  testPerProject(
    "shows the solo start button and hides settings until a second player joins",
    async ({ page }) => {
      await joinLobby(page, "Alex");

      await expect(
        page.getByRole("button", { name: "Start Game" }),
      ).toBeVisible();

      // Country Guesser's settings only apply to the multiplayer version
      // of the game (see GameLobby.vue), so alone neither the slider nor
      // the country-order dropdown should render at all.
      await expect(
        page.getByRole("slider", { name: "Game length (min)" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("combobox", { name: "Country order" }),
      ).toHaveCount(0);
    },
  );

  testPerProject(
    "hides Doodle's settings for a solo host and disables starting until a second player joins",
    async ({ page, context, browser }) => {
      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Alex");

      await page
        .locator(".gamepickerbutton", { hasText: "Doodle" })
        .click();
      await expect(
        page.locator(".gamepickerbutton", { hasText: "Doodle" }),
      ).toHaveClass(/gamepickerbutton-selected/);

      // Same as Country Guesser -- Doodle's settings (word box + round
      // length) only apply once there's an actual game to configure, so
      // alone neither renders at all.
      await expect(
        page.getByRole("textbox", { name: "Suggest a word" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("slider", { name: "Round length (sec)" }),
      ).toHaveCount(0);

      const startButton = page.getByRole("button", {
        name: "Need at least 2 players",
      });
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeDisabled();

      await page.getByRole("button", { name: "Copy Link" }).click();
      const inviteUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );

      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();
      await guestPage.goto(inviteUrl);
      await submitName(guestPage, "Steve");

      await expect(
        page.getByRole("button", { name: "Start Game" }),
      ).toBeEnabled();
      await expect(
        page.getByRole("textbox", { name: "Suggest a word" }),
      ).toBeVisible();

      await guestContext.close();
    },
  );

  testPerProject(
    "shows an invite link and copies it to the clipboard",
    async ({ page, context }) => {
      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Alex");

      await expect(page.getByText("Invite Others")).toBeVisible();
      await expect(
        page.locator(".gamelobby-invite-url"),
      ).toContainText("/play/");

      const copyButton = page.getByRole("button", {
        name: "Copy Link",
      });
      await copyButton.click();

      await expect(
        page.getByRole("button", { name: "Copied!" }),
      ).toBeVisible();
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toBe(page.url());
    },
  );

  testPerProject(
    "shows Country Guesser's multiplayer settings once a guest joins, live for both players",
    async ({ page, context, browser }, testInfo) => {
      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Marko");
      await page.getByRole("button", { name: "Copy Link" }).click();
      const inviteUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );

      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();
      await guestPage.goto(inviteUrl);
      await submitName(guestPage, "Steve");

      // The host badge is an icon, not text (see .gamelobby-player-crown
      // in GameLobby.vue) -- Marko's own name is shown in green instead
      // of a separate "you" label.
      await expect(
        page.locator(".gamelobby-player-crown"),
      ).toBeVisible();
      await expect(
        page.locator(".gamelobby-player-name.highlight"),
      ).toHaveText("Marko");
      await expect(page.getByText("Steve")).toBeVisible();

      // Host sees editable controls...
      await expect(
        page.getByRole("slider", { name: "Game length (min)" }),
      ).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "Country order" }),
      ).toBeVisible();

      // ...the guest sees the host's live picks as plain text instead.
      await expect(
        guestPage.getByText(/Game length: \d+ min/),
      ).toBeVisible();
      await expect(
        guestPage.getByText(/Country order: \w+/),
      ).toBeVisible();
      await expect(
        guestPage.getByRole("slider", { name: "Game length (min)" }),
      ).toHaveCount(0);

      await takeSnapshot(
        page,
        "Game Lobby Country Guesser Multiplayer Settings",
        testInfo,
      );

      // Host switches to Doodle -- the picker selection and settings
      // swap in place for both players, without re-inviting anyone.
      await page
        .locator(".gamepickerbutton", { hasText: "Doodle" })
        .click();
      await expect(
        page.locator(".gamepickerbutton", { hasText: "Doodle" }),
      ).toHaveClass(/gamepickerbutton-selected/);
      await expect(
        guestPage.locator(".gamepickerbutton", { hasText: "Doodle" }),
      ).toHaveClass(/gamepickerbutton-selected/);

      await expect(
        page.getByRole("textbox", { name: "Suggest a word" }),
      ).toBeVisible();
      await expect(
        page.getByRole("slider", { name: "Game length (min)" }),
      ).toHaveCount(0);

      await guestContext.close();
    },
  );

  testPerProject(
    "shows Doodle's settings: suggest-a-word above round length, and a computed total game length",
    async ({ page, context, browser }, testInfo) => {
      await context.grantPermissions([
        "clipboard-read",
        "clipboard-write",
      ]);
      await joinLobby(page, "Marko");
      await page.getByRole("button", { name: "Copy Link" }).click();
      const inviteUrl = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );

      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();
      await guestPage.goto(inviteUrl);
      await submitName(guestPage, "Steve");

      await page
        .locator(".gamepickerbutton", { hasText: "Doodle" })
        .click();
      await expect(
        page.locator(".gamepickerbutton", { hasText: "Doodle" }),
      ).toHaveClass(/gamepickerbutton-selected/);

      // The word-submit box is the settings group's first child --
      // above the round-length setting below it.
      await expect(
        page.locator(
          ".gamelobby-settings-group > .gamelobby-suggest:first-child",
        ),
      ).toBeVisible();
      const roundLengthSlider = page.getByRole("slider", {
        name: "Round length (sec)",
      });
      await expect(roundLengthSlider).toBeVisible();

      const totalLength = page
        .locator(".gamelobby-settings-readonly", {
          hasText: "Game length",
        })
        .locator(".gamelobby-settings-value");

      // Doodle plays one round per player -- the default round length
      // (70s, see DOODLE_DEFAULT_ROUND_LENGTH in GameLobby.vue) times
      // the 2 players here is 2 minutes 20 seconds.
      await expect(totalLength).toHaveText("2 min 20s");

      // The guest sees the host's round length as plain text, formatted
      // the same way as the computed game length above it.
      const guestRoundLength = guestPage
        .locator(".gamelobby-settings-readonly", {
          hasText: "Round length",
        })
        .locator(".gamelobby-settings-value");
      await expect(guestRoundLength).toHaveText("1 min 10s");

      // Host and guest can each independently suggest their own word.
      const hostWordInput = page.getByRole("textbox", {
        name: "Suggest a word",
      });
      await hostWordInput.fill("elephant");
      await page
        .getByRole("button", { name: "Submit", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Word submitted!" }),
      ).toBeDisabled();

      const guestWordInput = guestPage.getByRole("textbox", {
        name: "Suggest a word",
      });

      await guestWordInput.fill("fuck");
      await guestPage
        .getByRole("button", { name: "Submit", exact: true })
        .click();
      await expect(
        guestPage.getByText("Word contains inappropriate language"),
      ).toBeVisible();
      await expect(
        guestPage.getByRole("button", { name: "Word submitted!" }),
      ).toHaveCount(0);

      await guestWordInput.fill("giraffe");
      await guestPage
        .getByRole("button", { name: "Submit", exact: true })
        .click();
      await expect(
        guestPage.getByRole("button", { name: "Word submitted!" }),
      ).toBeDisabled();

      // Raising the round length updates the total for both players.
      await page.getByRole("spinbutton").fill("100");
      await expect(totalLength).toHaveText("3 min 20s");
      await expect(
        guestPage
          .locator(".gamelobby-settings-readonly", {
            hasText: "Game length",
          })
          .locator(".gamelobby-settings-value"),
      ).toHaveText("3 min 20s");
      await expect(guestRoundLength).toHaveText("1 min 40s");

      await takeSnapshot(
        page,
        "Game Lobby Doodle Settings",
        testInfo,
      );

      await guestContext.close();
    },
  );
});
