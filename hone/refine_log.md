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

## Round 2 (continue) - council back online

| Version | Gates | Council score (1 run, 3 judges) | Pairwise vs previous | Kept |
|---|---|---|---|---|
| v1 | 5/5 | 8.95 (C1 9, C2 9, C3 9, C4 8, C5 10) | - | - |
| v2 | 5/5 | 8.75 (C2 8, C4 9) | beat v1 3-0 | - |
| v3 | 5/5 | 8.60 (C2 8, C4 8) | beat v2 3-0 | yes |

- v2: screenshot / pasted-text import (importer.js + Tesseract.js), lane colours, Threw/Carried stamps, role-aware KDA target,
  data warnings (blank stats, < 5 players), heroes and top reason in share text/image, "Best on losing team" label.
- v3: one-tap Paste from clipboard, visible actual-vs-expected per stat, sticky-bar scroll padding, offline message for OCR.
- Tests: node (scoring + parser, incl. OCR-style text), e2e 26/26 incl. OCR of a synthetic dark scoreboard (hone/shots/e2e_scoreboard.png).
- Stop: pairwise prefers each newer version 3-0 but single absolute runs drift down (+-0.3 judge spread) as judges ask for the
  next tier (auto-advance, per-card uncertainty, share preview). Stopped after v3 to avoid chasing a moving bar.
- Not verified: OCR on real MLBB screenshots from real phones.
- Shipped: repo 95470ba, Pages live (importer.js 200), landing 5d32e9a, vault ce071df.
