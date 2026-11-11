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
- [x] 10. Pega-Vision + GLM-5.3-Flash: smallest text up to 12px
- [x] 11. GLM-5.3-Flash: sensitivity also tests kills and assists (kill participation)
- [x] 12. Pega-Thinking: the "Holds up / Could flip" line gets its own visual treatment
- [x] 13. Pega-Thinking: "estimates, not official data" caveat next to the verdict and in "How is this calculated?"
- [x] 14. Pega-Thinking: "How is this calculated?" as a short plain summary with the detail behind expanders
- [x] 15. Pega-Vision: worked example collapsed by default
- [x] 16. GLM-5.3-Flash: fetch the screenshot reader in the background so the first read does not wait
- [x] 17. Pega-Vision: faster phone entry (touch targets 44px, a column left blank by everyone is skipped; auto-advance declined: the app cannot know when a number is complete)
- [x] 18. Pega-Vision: compact chat-ready share image
- [x] Tests on v8: node test.js, e2e 89/89, offline 7/7, gates 5/5
- [x] Council on v8: score 9.0 (v7 9.3), pairwise v8 > v7 3-0, both orders agree; kept on the pairwise, stop: plateau
Sync and close:
- [x] Repo pushed, live site serves the kept version (app ddb00ad; live sw.js says whothrew-shell-v8)
- [x] Landing page /p/mlbb-blame/ (landing 0dcd82f; live page shows "Compact 1080")
- [x] Profile README section (72e3d3f; raw README has the detailed-or-compact line)
- [x] Portfolio card (catalog juw12/projects fbe5ac0; portfolio 06bb3f2; juwenlie.pages.dev shows the new text, checked 02:00)
- [x] Obsidian project note + Update Log (vault 5b396f7, plus a follow-up line for the portfolio card)
- [x] Lessons appended (19 bullets, mlbb-blame r6-7)
- [x] Cairn session ended (shipped)
- [x] Final report

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
- Assumed (round 7): a column left blank for the whole squad counts as "as expected" (0 points) for everyone instead of -1, and adds a mild caveat to the confidence chip.
- Assumed (round 7): the what-if steps for kills and assists are +-1..3 and never go below 0.
- Assumed (round 7): auto-advance between boxes is declined (the app cannot know when a number is complete; the "2/11/3" shorthand and the Next key already exist).
- Assumed (round 7): the share image default stays Detailed (1080x1560); the Compact choice (1080x1080) is remembered.
- Assumed (round 7): the copied chat text does not carry the estimates caveat (kept short); the caveat sits next to the verdict and in "How is this calculated?".
- Assumed (round 7): the screenshot reader is never fetched in the background on metered or data-saver connections, or without a service-worker controller.
- Assumed (round 7): v8 is kept on the unanimous pairwise (3-0, both orders) although its single absolute score (9.0) is 0.3 under v7's (9.3); this is the same call as rounds 2 and 4-6, where the pairwise decided and the absolute run was treated as within judge spread. The strict rule (score >= best + MIN_GAIN) would have reverted it.
- Assumed (round 7): the loop ends here on PLATEAU (2 rounds in this run under MIN_GAIN: +0.0, then -0.3). The nine suggestions the council made on v8 are closed by the stop rule with a reason each (not implemented) and are not carried as next items; they are not added to Precedent/Queue.md because the request was "no more next or open items".
- Assumed (sync v8): all pushes went through the local proxy at localhost:3128 (git http proxy option); the user-agent workaround was not used.
- Assumed (sync v8): the landing publish ran through an in-memory proxy override wrapper; the skill's own config was not changed.
- Assumed (sync v8): the vault push also carried two commits that other sessions had already made locally (78e71dd, df3a75d); their uncommitted files were left alone.
- Assumed (sync v8): the nine v8 council suggestions are closed by the plateau stop: none implemented, none queued.
- Assumed (sync v8): the portfolio card was refreshed by running the catalog's own generator locally (projects/scripts/publish_portfolio.py, the command sync-cards.yml runs) and pushing the one-line result, because `gh` is not installed here and the scheduled sync had not run since 15:39 UTC.

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

## Round 7 (2026-11-12) - v8

Targets: all nine council suggestions made on v7 (run queue items 10-18).

Changes (v8):
- Smallest text is 12px (`.score small`, `.mini > span`, `table.history td::before`).
- What-if check also moves kills and assists by 1 to 3 (never below 0) for the called player and the runner-up.
- The "Holds up" / "Could flip" line is its own box (`#sensitivity`, class `sens holds` or `sens flips`) with a bold lead.
- Estimates note under the verdict (`#estimateNote`) and in "How is this calculated?": role averages and weights are
  this app's own estimates, not official Moonton data.
- "How is this calculated?" opens on a three-sentence summary, the estimates note and "Not measured"; the worked
  example, formula, confidence rules, role reasons and bar key sit in five closed fold-outs. "How is this decided?"
  opens the section and the confidence fold-out.
- Screenshot reader warm-up: `loadScript` is memoised; `warmOcr()` runs when the import box opens or a screenshot
  button is touched or focused, and in idle time only if the reader is already saved or the connection is 4g without
  data saver. It always needs a service-worker controller.
- Touch targets are at least 44px under `@media (pointer: coarse)`.
- A column left blank for the whole squad is left out of the score for everyone (0 points, shown as a dash, one
  warning, and a clause on the confidence chip).
- Share image style: Detailed (1080x1560, unchanged) or Compact (1080x1080); the choice is remembered and can be
  switched from the preview.
- `sw.js` shell cache bumped to `whothrew-shell-v8`.
- Item 17's auto-advance was declined (see Assumptions).

Checks: `node test.js` pass (new tests 4b and 14d); `hone/e2e.py` 89/89 PASS (13 new steps); `hone/offline.py` 7/7;
`hone/check.py v8` gates 5/5 (shares 43/18/15/14/10).

e2e steps changed on purpose (the behaviour they checked moved): "method is open on the first analysis" reads
`#how` `textContent`, because the formula now sits in a closed fold-out; the worked-example step opens
`#howWorked` first and keeps its assertions. Added: summary with 5 closed fold-outs, estimates note beside the
verdict, kills and assists in the what-if for both players, the `sens holds` box, compact image 1080x1080 and its
download, remembered compact choice, switch back to 1080x1560 from the preview, no text under 12px (including
`::before` / `::after`), blank turret column reported once plus the chip clause, skipped stat at 0 points and a dash
for all five players, re-entering the stat restores 4.0, 35 touch targets at 44px or more, 320px without sideways
scroll. No step was deleted without a replacement.

Council (Pega-Vision, Pega-Thinking, GLM-5.3-Flash): v8 single score 9.0 (v7 was 9.3; judge totals 8.85 / 9.0 / 9.45;
criterion medians C1 9, C2 9, C3 9, C4 9, C5 9); pairwise v8 > v7 3-0, both orders agree, each judge calling v8 an
improvement with no regressions. Kept v8 on the pairwise (see Assumptions: the strict score rule would have reverted it).
The absolute run moved by -0.3: the C3 and C5 medians went from 10 to 9, and C5 (squad tracking) was not touched in v8,
so that part of the move is run-to-run judge spread, about +-0.3 as in rounds 2 and 4-6. Nothing here is "perfect".

stop: plateau (PLATEAU = 2: round 6 gained 0.0, round 7 gained -0.3; gates 5/5 and the score is above DONE_SCORE 8.5).

Correction: a working note earlier in this session gave the v8 score as 9.85. `hone/shots/v8/score.json` holds one run
and it says 9.0; 9.0 is the number used everywhere.

Council suggestions on v8 - closed by the stop rule, none implemented, none carried forward:
- Pega-Vision: calibrate role and hero baselines and show uncertainty. Declined: there is no real match dataset, so
  it would need invented numbers; the estimates note beside the verdict states this limit.
- Pega-Vision: shorter phone entry (role from hero, collapse optional columns, one screen per player). Not done:
  role-from-hero needs a hero table the app does not have. Already there: remembered hero and role per name, Last
  squad, "2/11/3" shorthand, blank columns skipped.
- Pega-Vision: pre-render the share image so Share has no "Drawing image..." wait. Already the case since v5 (the PNG
  is drawn right after analysis; the label only shows while that runs, with a text fallback since v6). No change.
- Pega-Thinking: move the "Holds up / Could flip" line into the banner. Partly done in v8 (its own coloured box);
  not moved.
- Pega-Thinking: make "How is this decided?" a button instead of a link. Not done.
- Pega-Thinking: open the paste box by default or add a hint. Not done; the one-tap Paste button (v3) and the
  clipboard offer (v7) fill the form without the box where the browser allows clipboard reading.
- GLM-5.3-Flash: Web Share Target so a screenshot can be sent to the app from the gallery. Not done: needs an
  installed PWA on Android and cannot be tested in desktop Chromium here.
- GLM-5.3-Flash: combined what-ifs (several stats at once). Not done; the line says each change was tried one at a time.
- GLM-5.3-Flash: wrap the "Less reliable" caveat on the share images instead of squeezing it into one line. Not done.

## Sync close-out (v8, 2026-11-12)
- App juw12/mlbb-blame ddb00ad; landing 0dcd82f; profile README 72e3d3f; catalog juw12/projects fbe5ac0; vault 5b396f7.
- Portfolio site: at 01:47 juwenlie.pages.dev still showed the round-3 card text. Cause: sync-cards.yml last ran at 15:39 UTC,
  before the round 4, round 5 and v8 catalog pushes (GitHub ran the hourly schedule only twice that day). `gh` is not installed,
  so the workflow could not be dispatched. Ran the same generator locally against a fresh portfolio clone: index.html changed by
  exactly one line (the Who Threw? card details), feed.xml unchanged. Pushed as juw12/portfolio 06bb3f2; "Deploy portfolio to
  GitHub Pages" succeeded; juwenlie.pages.dev and juw12.github.io/portfolio both show "detailed or compact result image" (02:00).
- "Check project card art" failed on 06bb3f2; it has failed on every portfolio push since at least 2026-11-10 (six runs before
  this one), so it is not caused by this change. The generator warns about another project's card image (vow). Not touched: outside this run.
- Stop: plateau (round 6 gain 0.0, round 7 gain -0.3 on the score, v8 kept on a 3-0 pairwise). Queue empty.
