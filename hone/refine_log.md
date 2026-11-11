# /hone run log: mlbb-analyzer (MLBB Blame & MVP Analyzer)

## Run queue
- [x] Freeze rubric mlbb-v1 + code checker (hone/check.py)
- [x] Baseline v0: gates 3/5 (G3 overflow 336px at 320, G5 shares summed to 101) - self-judged 5.6
- [x] Loop rounds: r1 kept (v1), stop: judge blocked -> self-judged, stopped at 1 round to avoid self-score inflation
- [ ] Sync: GitHub repo juw12/mlbb-blame + Pages
- [ ] Sync: profile README section
- [ ] Sync: portfolio card
- [ ] Sync: landing page /p/mlbb-blame/
- [ ] Sync: Obsidian project note + Update Log
- [ ] Final report

## Goal beyond the goal
Settle "who threw?" arguments in a squad chat in under a minute after the match, fairly enough that the
blamed player accepts the numbers.

## Assumptions
- Assumed: council blocked after 3 approaches (wrapped run, detached run with images, direct run without images and --timeout 90: all hung with empty output although `ping` returned 3 judges ok) -> self-judged, labelled as such.
- Assumed: project = mlbb-analyzer (the only project in this chat); repo name juw12/mlbb-blame.
- Assumed: role baselines/weights stay labelled as estimates (no official Moonton data) - no invented facts.

## Rounds
| round | change | gates | judge score | pairwise win | kept? | note |
|---|---|---|---|---|---|---|
| 0 | baseline (table entry, plain blame cards, history leaderboard) | 3/5 | 5.6 (self) | - | base | shares 101%, 320px overflow |
| 1 | largest-remainder %, call confidence, mobile card entry, draft autosave, Next match, share image + copy text, how-it-works, per-match history with delete/undo, export/import, gold crest theme | 5/5 + e2e 13/13 | 8.4 (self) | self | yes | C1 8.5, C2 8, C3 9, C4 7.5, C5 9.5 |

stop: judge blocked (council hung 3x) - self-judged; kept v1. Remaining gap to 10: screenshot import (OCR) for C2, stronger visual identity for C4.
