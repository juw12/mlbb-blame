# Who Threw? · MLBB blame & MVP analyzer

Settle the "who threw that game?" argument in your Mobile Legends: Bang Bang squad with numbers instead of shouting.

**Live:** https://juw12.github.io/mlbb-blame/

Type your team's stats from the end-of-match **Data** tab (K/D/A, gold, hero damage, damage taken, turret damage and role).
Each player gets a **role-aware impact score out of 10**, and the app names who is **most to blame** after a defeat or who is
the **MVP** after a victory, with the reasons in numbers.

## What it does

- **Fill from a screenshot or pasted text**: copy the text out of your end-of-match screenshot (iPhone Live Text or
  Google Lens), tap **Paste from clipboard**, and all five players are filled in. Or tap **Read screenshot** to let the app
  read the image itself (Tesseract.js, about 7 MB downloaded once on first use and then kept on the device, so later
  reads work without internet; the image never leaves your phone). Collapsed OCR
  spacing such as "Darren Fanny" is split using a list of MLBB hero names, OCR look-alikes (`7O00`) are corrected, and
  "Victory"/"Defeat" sets the result. Filled cards are highlighted so you check them before analyzing.
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
  points each one cost ("11 vs 6 deaths −0.7 pts"), and re-scores the match with up to 3 deaths fewer (loss) or more
  (win) for the called player: "Holds up" if the call survives, "Could flip" with the number of deaths if it does not.
- **The maths on every card**: "How 4.0 adds up" shows 6.0 for an average game plus or minus the points from each stat,
  next to the raw numbers ("11 deaths = 38% of team deaths, about 5 expected").
- **Data warnings**: the result and the confidence chip say so when fewer than 5 players were entered or a stat was left
  blank (counted as 0), e.g. "Clear call, but only 4 of 5 players entered".
- **Share to the squad chat**: on a phone one tap on **Share result image** opens the share sheet with the PNG and the
  text summary (the image is prepared as soon as the result appears); elsewhere it opens a preview with Download. The
  image labels its columns and the bar ("bar = share of blame"), and the copy-ready text names the runner-up. "Threw" /
  "Carried" stamps and lane colours on the cards.
- **Mobile-first entry**: one card per player, numeric keypad, type or paste `2/11/3` in K to fill K, D and A at once,
  Enter / Next on the keypad jumps to the next box, the draft is saved as you type, and "Next match" keeps the squad.
- **Remembers your squad**: a name you have analyzed before fills in its hero and role, and **Last squad** refills all
  five and puts the cursor on the first number. The built-in example is never remembered; "Forget saved players"
  (with Undo) clears it all.
- **Squad history**: leaderboard (average score, MVPs, times most to blame, form over the last 5 matches with an up/down
  trend), per-match list with every player's score and delete/undo, JSON export/import.
  Everything stays in your browser's local storage.
- **Works offline and installs like an app**: a service worker keeps the page available without a connection, and
  "Add to Home Screen" gives it an icon.

## Limits

The role baselines and weights in `scoring.js` are this app's own estimates, not official Moonton data, and end-screen stats
can't see rotations, vision, objective calls, the draft or early-game mistakes. Treat the verdict as evidence, not a ruling.
Screenshot reading was tested on a synthetic dark scoreboard, not on every phone's real MLBB screenshot; always check the
filled numbers. Offline use was tested in desktop Chromium with the network cut; the phone share sheet and "Add to Home
Screen" were not tested on a real phone. "Holds up / Could flip" only varies the called player's deaths.

## Run it

Open `index.html` in any browser. No build step, no dependencies. Offline mode and install need http(s), so use the live
link or `python -m http.server` for those.

## Tests

```
node test.js            # scoring + import parser: verdicts, shares sum to 100, point breakdown, sensitivity, edge cases
python hone/check.py v5 # gates: no console errors, no overflow at 320-1440 px, encoding (needs Playwright)
python hone/e2e.py      # every button: import, share (desktop + phone share sheet), roster, history, warnings, draft
python hone/offline.py  # reads a screenshot online once, cuts the network, then opens, analyzes and reads again
```

`e2e.py` and `offline.py` download the screenshot reader from a CDN. They use the proxy in `HONE_PROXY` (default
`http://proxy8.intra:80`); set `HONE_PROXY=""` on a network with direct internet.

MIT licence.
