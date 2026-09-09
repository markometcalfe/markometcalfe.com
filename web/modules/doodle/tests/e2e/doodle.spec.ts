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
} from "../../../play/tests/e2e/helpers";

test.beforeEach(async ({ context }, testInfo) => {
  await isolateRoomPerFile(context, testInfo, "doodle");
});

testPerProject(
  "suggests words, plays both rounds of a doodle game through to game over, and back to the lobby",
  async ({ page, context, browser }, testInfo) => {
    test.setTimeout(90000);

    await context.grantPermissions([
      "clipboard-read",
      "clipboard-write",
    ]);
    await joinLobby(page, "Marko");

    await page
      .locator(".gamepickerbutton", { hasText: "Doodle" })
      .click();
    await expect(
      page.locator(".gamepickerbutton", { hasText: "Doodle" }),
    ).toHaveClass(/gamepickerbutton-selected/);

    await page.getByRole("button", { name: "Copy Link" }).click();
    const inviteUrl = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(inviteUrl);
    await submitName(guestPage, "Steve");

    // Host suggests the round 1 word.
    const hostWordInput = page.getByRole("textbox", {
      name: "Suggest a word",
    });
    await hostWordInput.fill("elephant");
    await clickRobustly(
      page.getByRole("button", { name: "Submit", exact: true }),
    );
    const hostSubmittedButton = page.getByRole("button", {
      name: "Word submitted!",
    });
    await expect(hostSubmittedButton).toBeDisabled();
    // Limited to one word -- the input itself is disabled once
    // submitted (see DoodleSettings.vue's `:disabled="store.mySubmittedWord"`),
    // not just the button.
    await expect(hostWordInput).toBeDisabled();

    // Guest suggests the round 2 word. Word moderation itself (profanity
    // rejection) is already covered in lobby.spec.ts's Doodle settings
    // test -- this just needs a clean word suggested.
    const guestWordInput = guestPage.getByRole("textbox", {
      name: "Suggest a word",
    });
    await guestWordInput.fill("egg");
    await clickRobustly(
      guestPage.getByRole("button", { name: "Submit", exact: true }),
    );
    await expect(
      guestPage.getByRole("button", { name: "Word submitted!" }),
    ).toBeDisabled();

    // Host sets the round length to its 30s minimum -- game length is
    // just round length times player count (one round per player, see
    // DoodleSettings.vue), so 2 players * 30s = 1 min.
    await page.getByRole("spinbutton").fill("30");
    const totalLength = page
      .locator(".gamelobby-settings-readonly", {
        hasText: "Game length",
      })
      .locator(".gamelobby-settings-value");
    await expect(totalLength).toHaveText("1 min");

    // The guest sees both the host's live round length and the same
    // computed game length, as plain text.
    await expect(
      guestPage
        .locator(".gamelobby-settings-readonly", {
          hasText: "Round length",
        })
        .locator(".gamelobby-settings-value"),
    ).toHaveText("30s");
    await expect(
      guestPage
        .locator(".gamelobby-settings-readonly", {
          hasText: "Game length",
        })
        .locator(".gamelobby-settings-value"),
    ).toHaveText("1 min");
    await expect(
      guestPage.getByText("Waiting for the host to start…"),
    ).toBeVisible();

    const startGameButton = page.getByRole("button", {
      name: "Start Game",
    });
    await clickRobustly(startGameButton);

    // Both land on the game screen in place (no URL change -- see
    // [room].vue swapping GameLobby for DoodleGame on `startedGame`).
    await expect(page.locator(".headerbar-title")).toHaveText(
      "Doodle",
    );
    await expect(guestPage.locator(".headerbar-title")).toHaveText(
      "Doodle",
    );
    await expect(page.locator(".doodleroom-header-round")).toHaveText(
      "Round 1/2",
    );
    await expect(
      guestPage.locator(".doodleroom-header-round"),
    ).toHaveText("Round 1/2");

    // Marko (host) is drawOrder[0] -- seed() pre-registers the lobby host
    // as the room's first player before anyone's WebSocket connects (see
    // game-room.ts) -- so round 1 is always his to draw. The word and
    // timer are shown above the canvas, not in the header (see
    // DoodleCanvas.vue). The round timer is frozen at its starting value
    // under Playwright (see the IS_PLAYWRIGHT check in game-room.ts's
    // alarm()) rather than ticking down in real time, so it's always
    // exactly the 30s round length set below, through to the "Doodle
    // Gameplay" snapshot further down.
    await expect(page.locator(".doodlecanvas-word")).toHaveText(
      "elephant",
    );
    await expect(page.locator(".doodlecanvas-word-timer")).toHaveText(
      /^30\s*$/,
    );

    // Player list: Marko first (join order), host crown + drawing pencil
    // icons; Steve second, neither icon.
    const hostPlayers = page.locator(".doodleplayers-item");
    await expect(hostPlayers).toHaveCount(2);
    await expect(hostPlayers.nth(0)).toHaveClass(
      /doodleplayers-item-drawing/,
    );
    await expect(
      hostPlayers.nth(0).locator(".doodleplayers-item-name"),
    ).toContainText("Marko");
    await expect(
      hostPlayers.nth(0).locator(".doodleplayers-item-icon"),
    ).toHaveCount(2);
    await expect(
      hostPlayers.nth(0).locator(".doodleplayers-item-score"),
    ).toHaveText("0");
    await expect(hostPlayers.nth(1)).not.toHaveClass(
      /doodleplayers-item-drawing/,
    );
    await expect(
      hostPlayers.nth(1).locator(".doodleplayers-item-name"),
    ).toContainText("Steve");
    await expect(
      hostPlayers.nth(1).locator(".doodleplayers-item-icon"),
    ).toHaveCount(0);
    await expect(
      hostPlayers.nth(1).locator(".doodleplayers-item-score"),
    ).toHaveText("0");

    // Chat history: joins, then the round-start announcement. "Your
    // word" is only ever sent to the drawer's own session (see
    // sendFullState/doStartRound in game-room.ts), so only Marko's chat
    // shows it.
    const hostChat = page.locator(".doodlechat-messages");
    await expect(hostChat).toContainText("Marko joined");
    await expect(hostChat).toContainText("Steve joined");
    await expect(hostChat).toContainText("Marko is drawing!");
    await expect(hostChat).toContainText('Your word: "elephant"');

    const guestChat = guestPage.locator(".doodlechat-messages");
    await expect(guestChat).toContainText("Steve joined");
    await expect(guestChat).toContainText("Marko is drawing!");

    // Plain chat (not a guess) from the drawer reaches both tabs.
    const hostChatInput = page.getByRole("searchbox", {
      name: "Chat message",
    });
    await hostChatInput.fill("hello");
    await hostChatInput.press("Enter");
    await expect(
      hostChat.locator(".doodlechat-msg-chat", { hasText: "hello" }),
    ).toContainText("Marko");
    await expect(
      guestChat.locator(".doodlechat-msg-chat", { hasText: "hello" }),
    ).toContainText("Marko");

    // Offensive chat text isn't rejected with an error like a name or
    // suggested word -- it's silently swapped server-side for a "happy"
    // word instead (see censorText() in api/shared/profanity.ts), so the
    // sender never even finds out and the game keeps flowing. Guesses go
    // through the exact same censorText() call (see the "guess" handler's
    // incorrect-guess branch in game-room.ts), so this one check already
    // covers both paths.
    // Under Playwright, censorText() always picks the first happy word
    // (see the IS_PLAYWRIGHT check in game-room.ts) instead of a random
    // one, so this assertion -- and the Chromatic snapshot at the bottom
    // of this test that captures the chat panel -- are deterministic.
    const HAPPY_WORD = /^Marko:\s*rainbows\s*$/;
    const hostChatMessages = hostChat.locator(".doodlechat-msg-chat");
    await hostChatInput.fill("fuck");
    await hostChatInput.press("Enter");
    await expect(hostChatMessages).toHaveCount(2);
    await expect(hostChatMessages.nth(1)).toHaveText(HAPPY_WORD);
    await expect(
      guestChat.locator(".doodlechat-msg-chat"),
    ).toHaveCount(2);
    await expect(
      guestChat.locator(".doodlechat-msg-chat").nth(1),
    ).toHaveText(HAPPY_WORD);

    // Only the drawer sees the toolbar at all.
    await expect(
      guestPage.locator(".doodlecanvas-toolbar"),
    ).toHaveCount(0);

    // Marko picks gray (#6b7280) at brush size 16 and draws a stroke --
    // the color/size buttons have no text content, so their accessible
    // name is their `title` attribute (the hex code / "Size N").
    await clickRobustly(
      page.getByRole("button", { name: "#6b7280" }),
    );
    await clickRobustly(
      page.getByRole("button", { name: "Size 16" }),
    );

    const hostCanvas = page.locator(".doodlecanvas-el");
    const canvasBox = await hostCanvas.boundingBox();
    if (!canvasBox) {
      throw new Error("Doodle canvas has no bounding box");
    }
    const strokeStartX = canvasBox.x + canvasBox.width / 2;
    const strokeY = canvasBox.y + canvasBox.height / 2;
    await page.mouse.move(strokeStartX, strokeY);
    await page.mouse.down();
    await page.mouse.move(strokeStartX + 40, strokeY, { steps: 5 });
    await page.mouse.up();

    // The stroke is sent one `draw` WS message per mousemove (see
    // sendDraw in stores/doodle.ts) and painted into the guest's canvas
    // asynchronously -- polled via getImageData rather than a Locator
    // assertion, since pixel colour isn't something `expect(locator)`
    // can check directly. Canvas coordinates are normalised (0-1
    // fractions of the drawer's own bounding box, see normPos in
    // DoodleCanvas.vue), so the centre of *any* differently-sized
    // canvas across the two tabs always lands at the same (400, 300)
    // pixel of the shared 800x600 internal resolution.
    await expect
      .poll(() =>
        guestPage
          .locator(".doodlecanvas-el")
          .evaluate((canvas: HTMLCanvasElement) => {
            const ctx = canvas.getContext("2d")!;
            return Array.from(ctx.getImageData(400, 300, 1, 1).data);
          }),
      )
      .toEqual([0x6b, 0x72, 0x80, 255]);

    await takeSnapshot(page, "Doodle Gameplay", testInfo);

    // Steve's incorrect guess just appears as an ordinary chat entry.
    const guestGuessInput = guestPage.getByRole("searchbox", {
      name: "Chat message",
    });
    await guestGuessInput.fill("giraffe");
    await guestGuessInput.press("Enter");
    await expect(
      guestChat.locator(".doodlechat-msg-chat", {
        hasText: "giraffe",
      }),
    ).toContainText("Steve");

    // Steve's correct guess: he's the only non-drawer, so this ends the
    // round immediately (no waiting on the real round-length timer).
    // Points are `max(50, floor(timeLeft * 2))` against a 30s round
    // (game-room.ts), so bounded but not exactly predictable; Marko's
    // drawer bonus is a flat, exact +25.
    await guestGuessInput.fill("elephant");
    await guestGuessInput.press("Enter");

    await expect(hostChat).toContainText(/Steve guessed it! \+\d+/);
    await expect(
      hostPlayers.nth(0).locator(".doodleplayers-item-score"),
    ).toHaveText("25");
    const round1GuessPoints = Number(
      (
        await hostPlayers
          .nth(1)
          .locator(".doodleplayers-item-score")
          .innerText()
      ).trim(),
    );
    expect(round1GuessPoints).toBeGreaterThanOrEqual(50);
    expect(round1GuessPoints).toBeLessThanOrEqual(60);

    const hostRoundResult = page.locator(".doodleroundresult");
    await expect(
      hostRoundResult.locator(".doodleroundresult-heading"),
    ).toHaveText("Round Over!");
    await expect(
      hostRoundResult.locator(".doodleroundresult-word"),
    ).toContainText("elephant");
    await expect(
      hostRoundResult.locator(".doodleroundresult-next"),
    ).toHaveText("Next round starting shortly…");
    await expect(
      guestPage.locator(".doodleroundresult-heading"),
    ).toHaveText("Round Over!");

    await takeSnapshot(page, "Doodle Round Over", testInfo);

    // Round 2: Steve (drawOrder[1]) draws his own suggested word.
    await expect(page.locator(".doodleroom-header-round")).toHaveText(
      "Round 2/2",
      { timeout: 15000 },
    );
    await expect(hostChat).toContainText("Steve is drawing!");
    await expect(guestChat).toContainText('Your word: "egg"');

    await expect(hostPlayers.nth(0)).not.toHaveClass(
      /doodleplayers-item-drawing/,
    );
    await expect(hostPlayers.nth(1)).toHaveClass(
      /doodleplayers-item-drawing/,
    );
    await expect(page.locator(".doodlecanvas-toolbar")).toHaveCount(
      0,
    );
    await expect(
      guestPage.locator(".doodlecanvas-toolbar"),
    ).toBeVisible();

    // Marko is now the only guesser -- his correct guess both ends the
    // round and, since round 2 is the last round, ends the game once
    // the post-round transition elapses.
    await hostChatInput.fill("egg");
    await hostChatInput.press("Enter");

    await expect(
      hostRoundResult.locator(".doodleroundresult-word"),
    ).toContainText("egg");
    await expect(
      hostRoundResult.locator(".doodleroundresult-next"),
    ).toHaveText("Showing game results shortly…");

    const gameOverHeading = page.getByRole("heading", {
      name: "Game Over!",
    });
    await expect(gameOverHeading).toBeVisible({ timeout: 15000 });
    await expect(
      guestPage.getByRole("heading", { name: "Game Over!" }),
    ).toBeVisible();

    // Both players drew once and guessed once, so both scores are the
    // same "25 (drawer bonus) + 50-60 (guess bonus)" shape -- read
    // dynamically rather than hardcoding a winner, since which of the
    // two guessed with more time left (and so scored higher) isn't
    // deterministic.
    const finalScores = page.locator(".doodlegameresult-score");
    await expect(finalScores).toHaveCount(2);
    const scoreRows = await finalScores.all();
    const scores = await Promise.all(
      scoreRows.map(async row => ({
        name: await row
          .locator(".doodlegameresult-score-name")
          .innerText(),
        points: Number(
          await row
            .locator(".doodlegameresult-score-pts")
            .innerText(),
        ),
      })),
    );
    expect(scores.map(s => s.name).sort()).toEqual([
      "Marko",
      "Steve",
    ]);
    for (const { points } of scores) {
      expect(points).toBeGreaterThanOrEqual(75);
      expect(points).toBeLessThanOrEqual(85);
    }
    // Displayed already sorted descending (rank 1 first, see GameResult.vue).
    expect(scores[0]!.points).toBeGreaterThanOrEqual(
      scores[1]!.points,
    );
    await expect(page.locator(".doodlegameresult-winner")).toHaveText(
      `${scores[0]!.name} wins!`,
    );

    await takeSnapshot(page, "Doodle Game Over", testInfo);

    // Only the host gets a "Back to Lobby" button on the game-over
    // screen (see GameResult.vue), but their click still sends everyone
    // back (see "return_to_lobby" in api/play/src/lobby-room.ts,
    // broadcast to everyone regardless of sender).
    await clickRobustly(
      page
        .getByRole("main")
        .getByRole("button", { name: "Back to Lobby" }),
    );
    await expect(startGameButton).toBeVisible();
    await expect(
      guestPage.getByText("Waiting for the host to start…"),
    ).toBeVisible();

    await guestContext.close();
  },
);
