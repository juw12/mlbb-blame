# Rubric mlbb-v1 (frozen 2026-11-11, before any change)

Artifact: MLBB Blame & MVP Analyzer, a static web app (index.html + scoring.js), used right after a
Mobile Legends match to decide who is to blame (loss) or who earned the reward (win).

## Hard gates (code-checked, tools: test.js + hone/check.py)
- G1 `node test.js` passes (scoring correctness, shares sum to 1, edge cases).
- G2 No console errors or page errors on load, Load example, Analyze, Save at 1280 and 390 px.
- G3 No horizontal page overflow (scrollWidth <= innerWidth) at 320, 390, 768, 1024 and 1440 px in the result state.
- G4 Text files are UTF-8 without BOM and contain no mojibake.
- G5 Example loss blames Darren, and the displayed blame percentages sum to exactly 100.

## Soft criteria
- C1 Verdict trust and fairness (w=0.30): 4 = names a culprit with little explanation; 7 = role-aware score with per-stat reasons in numbers; 10 = transparent and role-aware, explains each verdict with numbers, shows how confident/close the call is, states limits, hard to misread.
- C2 Speed of use on a phone right after a match (w=0.25): 4 = desktop table that is cramped or scrolls sideways on a phone; 7 = usable on a phone with some friction; 10 = mobile-first entry, numeric keypad, sensible defaults, draft survives reload, one-hand friendly.
- C3 Shareability / social payoff (w=0.20): 4 = results only on screen; 7 = one-tap copy of a text summary; 10 = one-tap share of a clean result (text and image) ready for the squad group chat.
- C4 Visual design and clarity (w=0.15): 4 = generic or cluttered; 7 = clean, readable hierarchy; 10 = distinctive, game-flavoured, polished, clear hierarchy, accessible contrast.
- C5 Squad tracking (w=0.10): 4 = none; 7 = saved history leaderboard; 10 = history with per-match list, delete/undo, export/import backup.
