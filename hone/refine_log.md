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

## Round 3 (2026-11-11) - v4

Targets: the v3 council fixes (uncertainty on close calls, share-image polish, discoverable method, data warnings in the
verdict, faster K/D/A entry).

Changes (v4):
- `scoring.js`: named thresholds `CLEAR_GAP` = 1 and `MARGIN_GAP` = 0.4; `call` now carries `close`, `runnerUp`,
  `runnerUpScore`; each player gets `withinMargin` (score within 0.4 of the blamed/MVP player).
- Close calls name the runner-up in the banner; cards within the margin are tagged "Nearly as much to blame" / "Almost MVP".
- Confidence chip folds in data problems: "Clear call, but only 4 of 5 players entered".
- "How is this decided?" link under the verdict opens the explanation, which now lists the thresholds.
- Share image: preview dialog first (Share when the browser can share files, Download, Close); Why line wraps to 2 lines
  with an ellipsis; close calls show the runner-up on the image; text summary names the runner-up.
- Typing or pasting `2/11/3` into K, D or A fills all three and jumps to Gold.

Checks: `node test.js` pass (new test 11 for thresholds, runner-up and margin flags); `hone/e2e.py` 31/31 PASS (new:
share preview, chip warning, How link, K/D/A split, close-call runner-up); `hone/check.py v4` gates 5/5.

Council (Pega-Vision, Pega-Thinking, GLM-5.3-Flash): v4 single score 9.1 (v3 was 8.60); pairwise v4 > v3 3-0, both
orders agree. Kept v4.

Remaining council suggestions (not done): one-tap share without the preview step, absolute stat values beside the
percentages, remember returning players' hero/role, last-5 trend in history, offline OCR (Tesseract still needs one
download), auto-advance between stat fields.

## Round 4 (2026-11-11) - v5

Targets: every remaining v4 council suggestion (one-tap share, absolute stat values, remembered players, last-5 trend,
offline OCR, auto-advance between fields).

Changes (v5):
- "Why X and not Y?": the two stats that separate the top two players, in points ("11 vs 6 deaths -0.7 pts").
- Sensitivity line under the verdict: "Holds up" / "Could flip", varying the called player's deaths by +-3.
- Per-card maths: "How 4.0 adds up" (6.0 for an average game +- the points from each stat, with the raw numbers).
- "How is this decided?" opens by itself on the first analysis only.
- One-tap share on phones: the PNG is pre-rendered after analysis, so `navigator.share` runs inside the tap with
  file + text. Desktop keeps preview / download. Image has a caption row and "38% blame" per row; text has "Why not <runner-up>".
- Roster: hero and role remembered per name, "Last squad" (Undo), "Forget saved players" (Undo), Enter/Next walks the
  inputs. The built-in example squad is never remembered.
- History: "Form (last 5)" bars with a trend arrow, and every player's score per match.
- Offline: `sw.js` (shell cache `whothrew-shell-v5`, OCR cache `whothrew-ocr-v1`, deletes only `whothrew-*` caches),
  `manifest.webmanifest` and icons, so the page installs and the screenshot reader works without a connection after one use.

Checks: `node test.js` pass; `hone/e2e.py` 44/44 PASS (incl. OCR and both phone-share steps); `hone/offline.py` 7/7
(4 reader files, 7.1 MB measured, then app + analysis + OCR with the network dead); `hone/check.py v5` gates 5/5.
Tests reach the CDN through `HONE_PROXY` (default `http://proxy8.intra:80`).

Council (Pega-Vision, Pega-Thinking, GLM-5.3-Flash): v5 single score 9.1 (v4 was 9.1; judge totals 8.75 / 9.1 / 9.55);
pairwise v5 > v4 3-0, both orders agree. Kept v5. Absolute gain 0.0 < MIN_GAIN -> plateau count 1.

Remaining council suggestions: data caveats in the shared text and image, clearer "Tried" stamp and decider labels,
stacked phone layout for the leaderboard, import easier to find, Undo for Clear all, stat bars on each card,
sensitivity beyond deaths, text-only share fallback, richer share image.
