# /hone run log: mlbb-analyzer (MLBB Blame & MVP Analyzer)

## Run queue
- [x] Freeze rubric mlbb-v1 + code checker (hone/check.py)
- [x] Baseline v0: gates 3/5 (G3 overflow 336px at 320, G5 shares summed to 101) - self-judged 5.6
- [x] Loop rounds: r1 kept (v1), stop: judge blocked -> self-judged, stopped at 1 round to avoid self-score inflation
- [x] Sync: GitHub repo juw12/mlbb-blame + Pages
- [x] Sync: profile README section
- [x] Sync: portfolio card
- [x] Sync: landing page /p/mlbb-blame/
- [x] Sync: Obsidian project note + Update Log
- [x] Final report

## Run queue (rounds 6-7, started 2026-11-11 23:20, "close every council suggestion left on v6")
Round 6 (v7) - the nine suggestions left on v6:
- [x] 1. Pega-Vision: collapse stat strips and breakdowns by default (open only on the called player, one toggle for the rest)
- [x] 2. Pega-Vision: label the share as a relative share of this match (share note + image header)
- [x] 3. Pega-Vision: check the clipboard on load (offer bar, only when reading is already allowed)
- [x] 4. Pega-Vision: inline validation of parsed rows (review marks on suspect numbers)
- [x] 5. Pega-Thinking: bars inside "How X adds up" and on the share image
- [x] 6. Pega-Thinking: worked example in "How is this calculated?"
- [x] 7. GLM-5.3-Flash: runner-up sensitivity ("Holds up both ways")
- [x] 8. GLM-5.3-Flash: say whose favour the decider points are in ("leaves Darren 0.7 pts behind")
- [x] 9. GLM-5.3-Flash: autofocus the first empty box (desktop) and remember the last Victory/Defeat
- [x] Tests on v7: node test.js, e2e 76/76, offline 7/7, gates 5/5
- [x] Council on v7: score 9.3, pairwise v7 > v6 3-0
Round 7 (v8) - the nine suggestions the council made on v7 (joined the queue in this run):
- [ ] 10. Pega-Vision + GLM-5.3-Flash: smallest text up to 12px
- [ ] 11. GLM-5.3-Flash: sensitivity also tests kills and assists (kill participation)
- [ ] 12. Pega-Thinking: the "Holds up / Could flip" line gets its own visual treatment
- [ ] 13. Pega-Thinking: "estimates, not official data" caveat next to the verdict and in "How is this calculated?"
- [ ] 14. Pega-Thinking: "How is this calculated?" as a short plain summary with the detail behind expanders
- [ ] 15. Pega-Vision: worked example collapsed by default
- [ ] 16. GLM-5.3-Flash: fetch the screenshot reader in the background so the first read does not wait
- [ ] 17. Pega-Vision: faster phone entry (auto-advance, touch targets, turret damage optional)
- [ ] 18. Pega-Vision: compact chat-ready share image
- [ ] Tests on v8
- [ ] Council on v8 (keep only if it wins the pairwise against v7)
Sync and close:
- [ ] Repo pushed, live site serves the kept version
- [ ] Landing page /p/mlbb-blame/
- [ ] Profile README section
- [ ] Portfolio card
- [ ] Obsidian project note + Update Log
- [ ] Lessons appended
- [ ] Cairn session ended
- [ ] Final report

## Goal beyond the goal
Settle "who threw?" arguments in a squad chat in under a minute after the match, fairly enough that the
blamed player accepts the numbers.

## Assumptions
- Assumed: council blocked after 3 approaches (wrapped run, detached run with images, direct run without images and --timeout 90: all hung with empty output although `ping` returned 3 judges ok) -> self-judged, labelled as such.
- Assumed: project = mlbb-analyzer (the only project in this chat); repo name juw12/mlbb-blame.
- Assumed: role baselines/weights stay labelled as estimates (no official Moonton data) - no invented facts.
- Assumed (round 6): the import review thresholds are sanity heuristics for dropped or added digits (gold 5x, hero damage and damage taken 10x away from the others' median, K/D/A over 40), not game rules.
- Assumed (round 6): the load autofocus is desktop-only (pointer: fine) so phones do not pop the keyboard; after an import on touch the suspect box is scrolled into view, not focused.
- Assumed (round 6): the clipboard offer appears only when clipboard reading is already granted (Chromium) and never prompts; the last 8 used or dismissed texts are remembered so they are not offered again.
- Assumed (round 6): breakdowns start closed except on the called player; Clear all restores the remembered result; the example's result is not remembered; review marks do not survive a reload.
- Assumed (round 6): v7 kept on a 3-0 pairwise with a 0.0 score gain, the same way rounds 4 and 5 were kept; recorded as a plateau round.

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

## Round 5 (2026-11-11) - v6

Targets: every remaining v5 council suggestion (data caveats in shared outputs, clearer stamp and decider labels,
stacked phone leaderboard, easier-to-find import, Undo for Clear all, stat bars on each card, sensitivity beyond deaths,
text-only share fallback, richer share image).

Changes (v6):
- Sensitivity also swings gold, hero damage, damage taken and turret damage by 10% for the called player, one at a
  time, on top of deaths +-3; the line names every change that was tried and the one that flips the call.
- Deciders name both players and whose points they are ("Darren vs Kai: 11 vs 6 deaths -0.7 pts for Darren").
- Stat strip on every card: seven small bars for the points each stat added or cost (full height = 1.2 points),
  with a caption and an aria-label; columns with no weight for the role are faded.
- "Tried" stamp renamed "Best effort"; every stamp has a tooltip.
- Data caveat carried into the copied text ("Data note: ...") and drawn on the share image.
- Share image: lane-colour stripe per row and a rotated THREW / CARRIED stamp on the top row.
- Share button starts as "Drawing image..." and falls back to "Share result as text" if the PNG cannot be made;
  the preview dialog offers "Share text only" when files cannot be shared.
- Leaderboard stacks into one card per player at <= 600 px instead of scrolling sideways.
- "Read a screenshot" and "Paste copied stats" buttons above the form; stat inputs fit one row label each at 390 px.
- "Clear all" shows an Undo toast.
- `sw.js` shell cache bumped to `whothrew-shell-v6`.

Checks: `node test.js` pass (new test 14: stat-swing sensitivity); `hone/e2e.py` 56/56 PASS (12 new steps);
`hone/offline.py` 7/7; `hone/check.py v6` gates 5/5 (shares 43/18/15/14/10).

Council (Pega-Vision, Pega-Thinking, GLM-5.3-Flash): v6 single score 9.3 (v5 was 9.1; judge totals 8.85 / 9.3 / 9.3);
pairwise v6 > v5 3-0, both orders agree. Kept v6. Absolute gain 0.2 < MIN_GAIN -> plateau count 2.

Stopped: MAX_ROUNDS (5) reached and PLATEAU (2 rounds under MIN_GAIN) reached in the same round.

Council suggestions left on v6 (not done; two of them pull in opposite directions):
- Pega-Vision: collapse the stat strips and breakdowns by default to cut result density; label blame share as a
  relative share of the loss; check the clipboard on load; inline validation of parsed rows.
- Pega-Thinking: put the bars inside "How X adds up" and on the share image; a worked example in "How is this calculated?".
- GLM-5.3-Flash: also vary the runner-up's stats in the sensitivity check (or soften "Holds up"); say whose favour
  the decider points are in; autofocus the first empty stat box and remember the last Victory/Defeat choice.

## Round 6 (2026-11-12) - v7

Targets: all nine council suggestions left on v6 (run queue items 1-9).

Changes (v7):
- Import review: after a screenshot or paste, numbers that look like a dropped or added digit get a `.suspect`
  outline and a "check this" note; the first one is focused (desktop) or scrolled into view (touch).
- Clipboard offer: on open, focus or return to the tab, if clipboard reading is already allowed and the clipboard
  holds stats for 2+ players, a bar offers "Fill them in" / "Not now". It never prompts and never fills by itself.
- Result: breakdown strip moved inside "How X adds up"; open only on the called player, with
  "Show every player's breakdown" for the rest. Share note says the shares split this one match and total 100%.
- Sensitivity also moves the runner-up towards the called player ("Holds up both ways ...").
- Deciders say whose favour the points are in ("leaves Darren 0.7 pts behind").
- "How is this calculated?" opens with a five-step worked example built from the match on screen.
- Share image: one stat strip per player, header "BAR = SHARE OF BLAME (TOTAL 100%)".
- Entry: last Victory/Defeat is remembered; first empty box is focused on desktop only.
- `scoring.js`: breakdown entries carry `actual` and `expected`; `callSensitivity` covers the runner-up.
  `importer.js`: `reviewRows` exported, `IMPORT_FIELDS` global. `sw.js` cache `whothrew-shell-v7`.

Checks: `node test.js` pass; `hone/e2e.py` 76/76 PASS (20 new steps); `hone/offline.py` 7/7;
`hone/check.py v7` gates 5/5 (shares 43/18/15/14/10).

e2e steps changed on purpose (the behaviour they checked moved): the decider step asserts "leaves Darren" and
"pts behind" instead of "pts for Darren"; the strip step is now "called player's card shows the 7-stat strip without
opening anything; other cards stay short"; the click on the blame card's summary became "only the called player's
breakdown starts open"; the second summary click before "stat breakdown shows actual vs expected" was removed;
the import box is reopened after the reload in the v7 block; strip visibility uses `checkVisibility()`.
No step was deleted without a replacement.

Council (Pega-Vision, Pega-Thinking, GLM-5.3-Flash): v7 single score 9.3 (v6 was 9.3; judge totals 8.85 / 9.3 / 9.3;
criterion medians C1 9, C2 9, C3 10, C4 9, C5 10); pairwise v7 > v6 3-0, both orders agree. Kept v7 on the pairwise.
Absolute gain 0.0 < MIN_GAIN -> plateau round 1 of this run.

Council suggestions on v7 (all nine joined the run queue as items 10-18 for round 7):
- Pega-Vision: collapse the worked example and breakdowns on phones and raise the smallest text to 12px; faster
  phone entry (auto-advance, larger touch targets, turret damage optional); a compact chat-ready share image.
- Pega-Thinking: "How is this calculated?" as progressive disclosure in plainer words; a more prominent
  sensitivity line; the estimates caveat nearer the verdict.
- GLM-5.3-Flash: test kill participation in the sensitivity check; fetch the OCR assets ahead of first use;
  raise the smallest type sizes.
