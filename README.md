# Who Threw? · MLBB blame & MVP analyzer

Settle the "who threw that game?" argument in your Mobile Legends: Bang Bang squad with numbers instead of shouting.

**Live:** https://juw12.github.io/mlbb-blame/

Type your team's stats from the end-of-match **Data** tab (K/D/A, gold, hero damage, damage taken, turret damage and role).
Each player gets a **role-aware impact score out of 10**, and the app names who is **most to blame** after a defeat or who is
the **MVP** after a victory, with the reasons in numbers.

## What it does

- **Fill from a screenshot or pasted text**: two buttons sit right above the form. Copy the text out of your
  end-of-match screenshot (iPhone Live Text or Google Lens), tap **Paste copied stats**, and all five players are
  filled in. Or tap **Read a screenshot** to let the app
  read the image itself (Tesseract.js, about 7 MB downloaded once on first use and then kept on the device, so later
  reads work without internet; the image never leaves your phone). Collapsed OCR
  spacing such as "Darren Fanny" is split using a list of MLBB hero names, OCR look-alikes (`7O00`) are corrected, and
  "Victory"/"Defeat" sets the result. Filled cards are highlighted so you check them before analyzing. Once the
  reader is saved on the device it is started in the background when you open the import box or reach for a screenshot
  button, so the first read does not wait for it (never on a data-saver or slow connection).
- **Marks the numbers to check**: after an import, a box is outlined in orange with a note when its number is missing,
  is 0, or is far off the other players (gold 5 times, hero damage or damage taken 10 times above or below the
  others' median, e.g. "gold 760 looks too low next to the others (a dropped digit?)"). The cursor lands on the first
  marked box (on a phone it is scrolled into view), and fixing a box clears its mark.
- **Offers stats already on your clipboard**: when you open the app with copied stats for two or more players, a bar
  offers to fill them in with one tap. This only happens in browsers where reading the clipboard is already allowed
  (it never asks for permission); a text you used or dismissed is not offered again.
- **Role-aware scoring**: each stat is the player's share of the team total, compared with what that role usually gets.
  A Roam is not punished for low gold, and a Gold Laner is not punished for low damage taken. The KDA target is per role
  too (2.5 for Roam and EXP Lane, 3 for the others), and every stat shows its actual-vs-expected numbers on screen.
- **Blame and credit shares** that always add up to exactly 100%: in a loss blame is proportional to \((10 - \text{score})^2\);
  in a win credit is proportional to \(\text{score}^2\).
- **Confidence of the call**: "Clear call" when the top player is 1+ impact point away from the next one, "Fairly clear"
  from 0.4 to 1, and "Close call" under 0.4. In a close call the banner names the runner-up and every card within 0.4 of
  the top player is tagged "Nearly as much to blame" / "Almost MVP". A **How is this decided?** link under the verdict
  opens the full explanation (it is already open the first time you analyze a match).
- **Why this player and not the next one**: the verdict lists the two stats that separate the top two players, with the
  points each one cost ("Darren vs Kai: 11 vs 6 deaths leaves Darren 0.7 pts behind"), and re-scores the match for the
  called player with up to 3 deaths fewer (loss) or more (win), up to 3 more (loss) or fewer (win) kills and
  assists, and 10% more (loss) or less (win) gold, hero damage, damage taken and turret damage, one change at a time.
  The runner-up gets the same test in the opposite direction: "Holds up both ways" if the call survives all of them,
  "Could flip" with the change that flips it if not. The headline is set apart from the detail so it reads at a glance.
- **The maths on every card**: "How 4.0 adds up" holds a strip of seven small bars with the points each stat added
  (green) or cost (red), then 6.0 for an average game plus or minus those points, next to the raw numbers ("11 deaths
  = 38% of team deaths, about 5 expected"). It starts open on the called player only, so the other cards stay short;
  one button shows or hides every breakdown.
- **Method in layers**: "How is this calculated?" opens on a three-sentence summary and the note that the baselines
  are this app's own estimates. Five fold-outs hold the rest: a worked example that walks the called player's numbers
  through the formula in five steps, the formula, how sure the call is, the "why X and not Y" and "holds up" tests,
  and how to read the small bars. The same estimates note sits right under the verdict.
- **Data warnings**: the result and the confidence chip say so when fewer than 5 players were entered or a stat was left
  blank (counted as 0), e.g. "Clear call, but only 4 of 5 players entered". The same note travels with the copied
  text ("Data note: …") and the share image. A stat that **nobody** entered (say the whole squad skipped turret
  damage) is left out of the score for everyone instead of costing each player a point, and is shown as a dash.
- **Share to the squad chat**: on a phone one tap on **Share result image** opens the share sheet with the PNG and the
  text summary (the image is prepared as soon as the result appears); elsewhere it opens a preview with Download. The
  image labels its columns and the bar ("bar = share of blame (total 100%)"), shows the seven per-stat bars under each
  player, has a lane-colour stripe per player and a THREW / CARRIED stamp on the top row, and the copy-ready text names
  the runner-up and says the shares add up to 100% across the players. A note under the buttons explains that a share
  splits this one match and is not a grade. If the image can't be made or shared, the button shares the text instead.
  **Detailed / Compact** picks the image: the tall one with every stat bar, or a 1080 x 1080 square with bigger type
  that stays readable as a chat thumbnail. The choice is remembered and can be switched from the preview.
  "Threw" / "Carried" / "Best effort" stamps and lane colours on the cards.
- **Mobile-first entry**: one card per player, numeric keypad, type or paste `2/11/3` in K to fill K, D and A at once,
  Enter / Next on the keypad jumps to the next box, the draft is saved as you type, "Next match" keeps the squad, and
  "Clear all" can be undone. Your last Victory / Defeat choice is remembered, and on a computer the cursor starts in
  the first empty box (not on a touch screen, so the keyboard doesn't pop up). On a touch screen every button and
  fold-out heading is at least 44 px tall, and no text is smaller than 12 px.
- **Remembers your squad**: a name you have analyzed before fills in its hero and role, and **Last squad** refills all
  five and puts the cursor on the first number. The built-in example is never remembered; "Forget saved players"
  (with Undo) clears it all.
- **Squad history**: leaderboard (average score, MVPs, times most to blame, form over the last 5 matches with an up/down
  trend; stacked into one card per player on phones), per-match list with every player's score and delete/undo, JSON
  export/import.
  Everything stays in your browser's local storage.
- **Works offline and installs like an app**: a service worker keeps the page available without a connection, and
  "Add to Home Screen" gives it an icon.

## Limits

The role baselines and weights in `scoring.js` are this app's own estimates, not official Moonton data, and end-screen stats
can't see rotations, vision, objective calls, the draft or early-game mistakes. Treat the verdict as evidence, not a ruling.
Screenshot reading was tested on a synthetic dark scoreboard, not on every phone's real MLBB screenshot; always check the
filled numbers. Offline use was tested in desktop Chromium with the network cut; the phone share sheet and "Add to Home
Screen" were not tested on a real phone. "Holds up / Could flip" varies the called player's numbers and the
runner-up's (deaths, kills and assists by up to 3; gold, hero damage, damage taken and turret damage by 10%), one
change at a time, not several together and not the other three players'. A stat is only left out of the score when all
entered players left it blank; if one player has it, blanks count as 0 for the rest. The compact image and the 44 px
touch targets were checked in desktop Chromium with touch emulated, not on a real phone. The orange "check this number" marks are sanity checks for dropped
or added digits, not game rules. The clipboard offer needs a browser that lets a page ask whether clipboard reading
is already allowed (Chromium-based); elsewhere use the **Paste copied stats** button.

## Run it

Open `index.html` in any browser. No build step, no dependencies. Offline mode and install need http(s), so use the live
link or `python -m http.server` for those.

## Tests

```
node test.js            # scoring + import parser: verdicts, shares sum to 100, point breakdown, sensitivity, review marks
python hone/check.py v8 # gates: no console errors, no overflow at 320-1440 px, encoding (needs Playwright)
python hone/e2e.py      # every button: import + review marks, clipboard offer, share (both images, desktop + phone), roster, history, draft, 44 px targets
python hone/offline.py  # reads a screenshot online once, cuts the network, then opens, analyzes and reads again
```

`e2e.py` and `offline.py` download the screenshot reader from a CDN. They use the proxy in `HONE_PROXY` (default
`http://proxy8.intra:80`); set `HONE_PROXY=""` on a network with direct internet.

MIT licence.
