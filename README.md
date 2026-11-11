# Who Threw? · MLBB blame & MVP analyzer

Settle the "who threw that game?" argument in your Mobile Legends: Bang Bang squad with numbers instead of shouting.

**Live:** https://juw12.github.io/mlbb-blame/

Type your team's stats from the end-of-match **Data** tab (K/D/A, gold, hero damage, damage taken, turret damage and role).
Each player gets a **role-aware impact score out of 10**, and the app names who is **most to blame** after a defeat or who is
the **MVP** after a victory, with the reasons in numbers.

## What it does

- **Fill from a screenshot or pasted text**: copy the text out of your end-of-match screenshot (iPhone Live Text or
  Google Lens), tap **Paste from clipboard**, and all five players are filled in. Or tap **Read screenshot** to let the app
  read the image itself (Tesseract.js, downloaded once on first use; the image never leaves your phone). Collapsed OCR
  spacing such as "Darren Fanny" is split using a list of MLBB hero names, OCR look-alikes (`7O00`) are corrected, and
  "Victory"/"Defeat" sets the result. Filled cards are highlighted so you check them before analyzing.
- **Role-aware scoring**: each stat is the player's share of the team total, compared with what that role usually gets.
  A Roam is not punished for low gold, and a Gold Laner is not punished for low damage taken. The KDA target is per role
  too (2.5 for Roam and EXP Lane, 3 for the others), and every stat shows its actual-vs-expected numbers on screen.
- **Blame and credit shares** that always add up to exactly 100%: in a loss blame is proportional to \((10 - \text{score})^2\);
  in a win credit is proportional to \(\text{score}^2\).
- **Confidence of the call**: "Clear call" when the top player is 1+ point away from the next one, "Close call" otherwise.
- **Data warnings**: the result says so when fewer than 5 players were entered or a stat was left blank (counted as 0).
- **Share to the squad chat**: one-tap result image (Web Share on phones, PNG download on desktop) and a copy-ready text
  summary, both with heroes and the main reason for the verdict. "Threw" / "Carried" stamps and lane colours on the cards.
- **Mobile-first entry**: one card per player, numeric keypad, the draft is saved as you type, and "Next match" keeps the squad.
- **Squad history**: leaderboard (average score, MVPs, times most to blame), per-match list with delete/undo, JSON export/import.
  Everything stays in your browser's local storage.

## Limits

The role baselines and weights in `scoring.js` are this app's own estimates, not official Moonton data, and end-screen stats
can't see rotations, vision, objective calls, the draft or early-game mistakes. Treat the verdict as evidence, not a ruling.
Screenshot reading was tested on a synthetic dark scoreboard, not on every phone's real MLBB screenshot; always check the
filled numbers.

## Run it

Open `index.html` in any browser. No build step, no dependencies.

## Tests

```
node test.js            # scoring + import parser: verdicts, shares sum to 100, OCR-style text, edge cases
python hone/check.py v3 # gates: no console errors, no overflow at 320-1440 px, encoding (needs Playwright)
python hone/e2e.py      # every button: paste/clipboard/screenshot import, share, copy, history, warnings, draft restore
```

MIT licence.
