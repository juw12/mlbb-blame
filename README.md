# Who Threw? · MLBB blame & MVP analyzer

Settle the "who threw that game?" argument in your Mobile Legends: Bang Bang squad with numbers instead of shouting.

**Live:** https://juw12.github.io/mlbb-blame/

Type your team's stats from the end-of-match **Data** tab (K/D/A, gold, hero damage, damage taken, turret damage and role).
Each player gets a **role-aware impact score out of 10**, and the app names who is **most to blame** after a defeat or who is
the **MVP** after a victory, with the reasons in numbers.

## What it does

- **Role-aware scoring**: each stat is the player's share of the team total, compared with what that role usually gets.
  A Roam is not punished for low gold, and a Gold Laner is not punished for low damage taken.
- **Blame and credit shares** that always add up to exactly 100%: in a loss blame is proportional to \((10 - \text{score})^2\);
  in a win credit is proportional to \(\text{score}^2\).
- **Confidence of the call**: "Clear call" when the top player is 1+ point away from the next one, "Close call" otherwise.
- **Share to the squad chat**: one-tap result image (Web Share on phones, PNG download on desktop) and a copy-ready text summary.
- **Mobile-first entry**: one card per player, numeric keypad, the draft is saved as you type, and "Next match" keeps the squad.
- **Squad history**: leaderboard (average score, MVPs, times most to blame), per-match list with delete/undo, JSON export/import.
  Everything stays in your browser's local storage.

## Limits

The role baselines and weights in `scoring.js` are this app's own estimates, not official Moonton data, and end-screen stats
can't see rotations, vision, objective calls, the draft or early-game mistakes. Treat the verdict as evidence, not a ruling.

## Run it

Open `index.html` in any browser. No build step, no dependencies.

## Tests

```
node test.js            # scoring: verdicts, shares sum to 100, edge cases
python hone/check.py v1 # gates: no console errors, no overflow at 320-1440 px, encoding (needs Playwright)
python hone/e2e.py      # every button: share image, copy, save/delete/undo, export/import, draft restore
```

MIT licence.
