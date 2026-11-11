// Run: node test.js
const assert = require("assert");
const { analyzeMatch, roundedPercents, squadStats, CLEAR_GAP, MARGIN_GAP, RECENT_GAMES } = require("./scoring.js");

const sumShares = (a) => a.players.reduce((t, p) => t + p.share, 0);
const byName = (a, name) => a.players.find((p) => p.name === name);

// 1. Loss where the jungler fed (2/11/3, lowest gold) -> jungler is most to blame.
const loss = analyzeMatch({
  result: "lose",
  players: [
    { name: "Juwen", role: "Gold Lane", kills: 6, deaths: 3, assists: 5, gold: 11800, damage: 78400, taken: 31200, turret: 6100 },
    { name: "Ah Beng", role: "EXP Lane", kills: 3, deaths: 5, assists: 7, gold: 9100, damage: 52300, taken: 88400, turret: 2900 },
    { name: "Mei", role: "Mid Lane", kills: 4, deaths: 4, assists: 8, gold: 9400, damage: 81200, taken: 30100, turret: 1500 },
    { name: "Darren", role: "Jungle", kills: 2, deaths: 11, assists: 3, gold: 7600, damage: 38700, taken: 47800, turret: 800 },
    { name: "Kai", role: "Roam", kills: 0, deaths: 6, assists: 13, gold: 5900, damage: 18100, taken: 79600, turret: 600 },
  ],
});
assert.strictEqual(byName(loss, "Darren").verdict, "Most to blame");
assert.ok(Math.abs(sumShares(loss) - 1) < 1e-9);
// A roamer with 0 kills and low gold must NOT be blamed just for that (role-aware).
assert.ok(byName(loss, "Kai").score > byName(loss, "Darren").score);
assert.ok(byName(loss, "Darren").weaknesses.some((w) => w.stat === "deaths"));

// 2. Win carried by a mid laner -> mid is MVP.
const win = analyzeMatch({
  result: "win",
  players: [
    { name: "A", role: "Gold Lane", kills: 4, deaths: 3, assists: 6, gold: 10000, damage: 60000, taken: 30000, turret: 5000 },
    { name: "B", role: "EXP Lane", kills: 3, deaths: 3, assists: 8, gold: 9000, damage: 45000, taken: 70000, turret: 3000 },
    { name: "C", role: "Mid Lane", kills: 12, deaths: 1, assists: 6, gold: 13000, damage: 120000, taken: 25000, turret: 2500 },
    { name: "D", role: "Jungle", kills: 5, deaths: 2, assists: 7, gold: 10500, damage: 55000, taken: 35000, turret: 3000 },
    { name: "E", role: "Roam", kills: 1, deaths: 3, assists: 18, gold: 6000, damage: 15000, taken: 65000, turret: 800 },
  ],
});
assert.strictEqual(byName(win, "C").verdict, "MVP");
assert.ok(Math.abs(sumShares(win) - 1) < 1e-9);

// 3. Perfectly "average" team (stats exactly at role expectation) -> everyone scores near 6-7, no NaN.
const roles = ["Gold Lane", "EXP Lane", "Mid Lane", "Jungle", "Roam"];
const avg = analyzeMatch({
  result: "lose",
  players: roles.map((role, i) => ({
    name: `P${i}`, role, kills: 2, deaths: 2, assists: 4,
    gold: [24, 20, 21, 24, 11][i] * 100, damage: [24, 18, 25, 22, 11][i] * 1000,
    taken: [14, 27, 14, 18, 27][i] * 1000, turret: [32, 20, 16, 20, 12][i] * 100,
  })),
});
for (const p of avg.players) {
  assert.ok(Number.isFinite(p.score) && p.score >= 5 && p.score <= 7.5, `${p.role} scored ${p.score}`);
}

// 4. Edge cases: zero deaths / zero turret damage / zero kills -> finite scores, shares still sum to 1.
const edge = analyzeMatch({
  result: "win",
  players: [
    { name: "X", role: "Gold Lane", kills: 0, deaths: 0, assists: 0, gold: 0, damage: 0, taken: 0, turret: 0 },
    { name: "Y", role: "Gold Lane", kills: 0, deaths: 0, assists: 0, gold: 0, damage: 0, taken: 0, turret: 0 },
  ],
});
assert.ok(edge.players.every((p) => Number.isFinite(p.score)));
assert.ok(Math.abs(sumShares(edge) - 1) < 1e-9);

// 4b. A column nobody filled in is left out (neutral for everyone) instead of scoring -1 for the whole squad.
const blankTurret = analyzeMatch({ result: "lose", players: loss.players.map((p) => ({ ...p, turret: 0 })) });
for (const p of blankTurret.players) {
  const row = p.breakdown.find((b) => b.stat === "turret");
  assert.strictEqual(row.skipped, true);
  assert.strictEqual(row.value, 0);
  assert.strictEqual(row.points, 0);
  assert.ok(/left out/.test(row.text) && /left out/.test(row.brief), row.text);
  // Every other stat is untouched by the blank column.
  const before = byName(loss, p.name).breakdown;
  for (const b of p.breakdown) {
    if (b.stat === "turret") continue;
    assert.strictEqual(b.skipped, false);
    assert.ok(Math.abs(b.points - before.find((x) => x.stat === b.stat).points) < 1e-9, `${p.name} ${b.stat}`);
  }
  // The score is the base 6 plus the remaining stats, with nothing taken off for the blank column.
  const rebuilt = 6 + p.breakdown.reduce((t, b) => t + b.points, 0);
  assert.ok(Math.abs(Math.min(10, Math.max(0, rebuilt)) - p.rawScore) < 1e-9, p.name);
}
assert.strictEqual(byName(blankTurret, "Darren").verdict, "Most to blame");
assert.ok(blankTurret.call.deciders.every((d) => d.stat !== "turret"));
// One player's blank is still a real 0: the column is only left out when the whole squad has none.
const oneBlank = analyzeMatch({ result: "lose", players: loss.players.map((p) => (p.name === "Kai" ? { ...p, turret: 0 } : p)) });
assert.ok(oneBlank.players.every((p) => p.breakdown.every((b) => b.skipped === false)));
assert.strictEqual(byName(oneBlank, "Kai").breakdown.find((b) => b.stat === "turret").value, -1);
// The entered example is unchanged by this rule.
assert.ok(loss.players.every((p) => p.breakdown.every((b) => b.skipped === false)));
assert.deepStrictEqual(loss.players.map((p) => p.sharePct), [10, 15, 14, 43, 18]);

// 5. Displayed whole percents always sum to exactly 100 (example loss used to show 101).
for (const a of [loss, win, avg, edge]) {
  assert.strictEqual(a.players.reduce((t, p) => t + p.sharePct, 0), 100);
}
assert.deepStrictEqual(roundedPercents([1 / 3, 1 / 3, 1 / 3]).sort(), [33, 33, 34]);

// 6. Confidence of the call: Darren is far behind the runner-up -> clear call; equal scores -> close call.
assert.strictEqual(loss.call.label, "Clear call");
assert.ok(edge.call.label.startsWith("Close call"));

// 6b. KDA target is role-aware: the 0/6/13 Roam is measured against 2.5, not 3.
const kai = byName(loss, "Kai");
const kaiKda = kai.breakdown.find((b) => b.label === "KDA");
assert.ok(kaiKda.text.includes("target 2.5"), kaiKda.text);
assert.ok(byName(loss, "Juwen").breakdown.find((b) => b.label === "KDA").text.includes("target 3"));

// 7. Import: tidy one-line-per-player text (tabs, roles, 38.7k, 47,800).
const { parseStatsText } = require("./importer.js");
const tidy = parseStatsText([
  "Player\tHero\tRole\tK/D/A\tGold\tHero dmg\tTaken\tTurret",
  "Juwen\tClaude\tGold Lane\t6/3/5\t11800\t78.4k\t31,200\t6100",
  "Ah Beng\tYu Zhong\tEXP\t3/5/7\t9100\t52300\t88400\t2900",
  "Mei\tPharsa\tMid\t4/4/8\t9400\t81200\t30100\t1500",
  "Darren\tFanny\tJungle\t2/11/3\t7600\t38700\t47800\t800",
  "Kai\tTigreal\tRoam\t0/6/13\t5900\t18100\t79600\t600",
].join("\n"));
assert.strictEqual(tidy.players.length, 5);
assert.deepStrictEqual(tidy.warnings, []);
assert.deepStrictEqual(tidy.players[0], {
  name: "Juwen", hero: "Claude", role: "Gold Lane", kills: 6, deaths: 3, assists: 5,
  gold: 11800, damage: 78400, taken: 31200, turret: 6100,
});
assert.strictEqual(tidy.players[1].name, "Ah Beng");
assert.strictEqual(tidy.players[1].role, "EXP Lane");
assert.strictEqual(tidy.players[3].deaths, 11);
assert.strictEqual(tidy.players[4].role, "Roam");

// 8. Import: OCR-style text - name on its own line, numbers split over lines,
//    O instead of 0, teamfight %, a KDA ratio and a medal score to skip.
const ocr = parseStatsText([
  "VICTORY  Data",
  "Darren",
  "Fanny 2/11/3 0.5 38%",
  "76O0 38,700",
  "47.800 8OO",
  "Kai  Tigreal",
  "0 / 6 / 13  2.2  71%  5900  18.1k  79600  600  6.1",
].join("\n"));
assert.strictEqual(ocr.players.length, 2);
assert.strictEqual(ocr.result, "win");
assert.strictEqual(tidy.result, null);
assert.deepStrictEqual(
  { ...ocr.players[0] },
  { name: "Darren", hero: "Fanny", role: "", kills: 2, deaths: 11, assists: 3, gold: 7600, damage: 38700, taken: 47800, turret: 800 },
);
assert.strictEqual(ocr.players[1].name, "Kai");
assert.strictEqual(ocr.players[1].hero, "Tigreal");
assert.strictEqual(ocr.players[1].damage, 18100);
assert.strictEqual(ocr.players[1].turret, 600);

// 9. Import: partial rows warn, names that look like OCR noise are kept, junk gives guidance.
const partial = parseStatsText("Oscar · Ling 5/1/9 10200\nIlya 1/2/3");
assert.strictEqual(partial.players[0].name, "Oscar");
assert.strictEqual(partial.players[0].hero, "Ling");
assert.strictEqual(partial.players[0].gold, 10200);
assert.strictEqual(partial.players[1].name, "Ilya");
assert.deepStrictEqual(partial.warnings, [
  "Oscar: no hero dmg, dmg taken, turret dmg found",
  "Ilya: no gold, hero dmg, dmg taken, turret dmg found",
]);
// A header row must not leak into the first player's name.
const headed = parseStatsText("Player  Hero  K/D/A  Gold\nDarren 2/11/3 7600 38700 47800 800");
assert.strictEqual(headed.players[0].name, "Darren");

// 10. Collapsed OCR spacing: a known hero at the end of the name is split off and spelled properly.
const collapsed = parseStatsText("Darren Fanny 2/11/3 7600\nAhBeng YuZhong 3/5/7 9100\nAh Beng 1/2/3 5000\nLing 4/1/6 9000");
assert.deepStrictEqual(
  collapsed.players.map((p) => [p.name, p.hero]),
  [["Darren", "Fanny"], ["AhBeng", "Yu Zhong"], ["Ah Beng", ""], ["Ling", ""]],
);
const junk = parseStatsText("gg ez report jungler");
assert.strictEqual(junk.players.length, 0);
assert.ok(junk.warnings[0].includes("K/D/A"));

// 11. Confidence: thresholds are named, the runner-up is reported, and near-ties are flagged per player.
assert.strictEqual(CLEAR_GAP, 1);
assert.strictEqual(MARGIN_GAP, 0.4);
assert.strictEqual(loss.call.runnerUp !== "Darren", true);
assert.strictEqual(loss.call.close, loss.call.gap < MARGIN_GAP);
const twin = { role: "Mid Lane", kills: 3, deaths: 4, assists: 6, gold: 9000, damage: 60000, taken: 30000, turret: 1000 };
const nearTie = analyzeMatch({
  result: "lose",
  players: [
    { ...twin, name: "A", role: "Gold Lane", kills: 7, deaths: 2, gold: 12000, damage: 80000 },
    { ...twin, name: "B", role: "EXP Lane", taken: 80000 },
    { ...twin, name: "C" },
    { ...twin, name: "D", role: "Jungle", deaths: 9 },
    { ...twin, name: "E", role: "Jungle", deaths: 9, assists: 5 },
  ],
});
const blamed = nearTie.players.find((p) => p.verdict === "Most to blame");
assert.ok(nearTie.call.close, `expected a close call, gap ${nearTie.call.gap}`);
assert.ok(["D", "E"].includes(blamed.name));
assert.strictEqual(nearTie.call.runnerUp, blamed.name === "D" ? "E" : "D");
assert.strictEqual(byName(nearTie, nearTie.call.runnerUp).withinMargin, true);
assert.strictEqual(blamed.withinMargin, false);
assert.strictEqual(byName(nearTie, "A").withinMargin, false);
// A clear call flags nobody.
if (!loss.call.close) assert.ok(loss.players.every((p) => !p.withinMargin) || loss.call.gap < MARGIN_GAP);

// 12. Reasons carry the raw numbers, and every stat reports its contribution in score points.
const darren = byName(loss, "Darren");
const darrenGold = darren.breakdown.find((b) => b.stat === "gold");
assert.ok(darrenGold.text.startsWith("7,600 gold = "), darrenGold.text);
assert.ok(/about [\d,]+\)$/.test(darrenGold.text), darrenGold.text);
assert.ok(darrenGold.brief.includes("of team gold") && !darrenGold.brief.includes("7,600"), darrenGold.brief);
assert.ok(darren.breakdown.find((b) => b.stat === "kp").text.startsWith("In 5 of 15 team kills"));
assert.ok(darren.breakdown.find((b) => b.stat === "kda").text.includes("from 2/11/3"));
for (const a of [loss, win, avg]) {
  for (const p of a.players) {
    const fromPoints = 6 + p.breakdown.reduce((t, b) => t + b.points, 0);
    assert.ok(Math.abs(Math.min(10, Math.max(0, fromPoints)) - p.rawScore) < 1e-9, `${p.name}: 6 + points = ${fromPoints}, score ${p.rawScore}`);
  }
}

// 13. Deciders: the stats that separate the blamed player from the runner-up, largest gap first.
assert.ok(loss.call.deciders.length >= 1 && loss.call.deciders.length <= 2);
assert.ok(loss.call.deciders[0].points > 0);
assert.ok(loss.call.deciders.every((d, i, all) => i === 0 || all[i - 1].points >= d.points));
assert.ok(loss.call.deciders.some((d) => d.stat === "deaths" && d.text === "11 vs 6 deaths"), JSON.stringify(loss.call.deciders));
assert.ok(win.call.deciders[0].points > 0);

// 14. Sensitivity: a clear call survives 3 fewer deaths and a 10% swing in every other stat; a near-tie flips on the first death.
const { swing, swings, kills: lossKills, assists: lossAssists, runnerUp: lossRunner, holds: lossHolds, ...lossDeaths } = loss.call.sensitivity;
assert.deepStrictEqual(lossDeaths, { flips: false, steps: 3, to: null });
assert.strictEqual(swing, 0.1);
assert.deepStrictEqual(swings.map((s) => s.stat), ["gold", "damage", "taken", "turret"]);
assert.deepStrictEqual(swings.map((s) => s.label), ["gold", "hero damage", "damage taken", "turret damage"]);
assert.ok(swings.every((s) => s.flips === false && s.to === null), JSON.stringify(swings));
assert.ok(win.call.sensitivity.swings.every((s) => !s.flips));
const tieSwings = nearTie.call.sensitivity.swings;
assert.ok(tieSwings.some((s) => s.flips && s.to === nearTie.call.runnerUp), JSON.stringify(tieSwings));
assert.strictEqual(nearTie.call.sensitivity.flips, true);
assert.strictEqual(nearTie.call.sensitivity.steps, 1);
assert.strictEqual(nearTie.call.sensitivity.to, nearTie.call.runnerUp);
assert.strictEqual(win.call.sensitivity.flips, false);
// A blamed player with no deaths has nothing to take away: no steps are tried.
assert.strictEqual(analyzeMatch({ result: "lose", players: edge.players.map(({ name, role }) => ({ ...twin, name, role, deaths: 0 })) }).call.sensitivity.steps, 0);

// 14b. The same checks run on the runner-up, moved towards the called player (worse in a loss, better in a win).
assert.strictEqual(lossRunner.name, loss.call.runnerUp);
assert.deepStrictEqual({ flips: lossRunner.flips, steps: lossRunner.steps, to: lossRunner.to }, { flips: false, steps: 3, to: null });
assert.deepStrictEqual(lossRunner.swings.map((s) => s.stat), ["gold", "damage", "taken", "turret"]);
assert.ok(lossRunner.swings.every((s) => !s.flips && s.to === null), JSON.stringify(lossRunner.swings));
assert.strictEqual(lossHolds, true);
const winRunner = win.call.sensitivity.runnerUp;
assert.strictEqual(winRunner.name, win.call.runnerUp);
assert.strictEqual(win.call.sensitivity.holds, !winRunner.flips && winRunner.swings.every((s) => !s.flips));
// A near-tie is not allowed to claim it holds, and a runner-up flip always lands on the runner-up.
assert.strictEqual(nearTie.call.sensitivity.holds, false);
const tieRunner = nearTie.call.sensitivity.runnerUp;
assert.strictEqual(tieRunner.name, nearTie.call.runnerUp);
assert.strictEqual(tieRunner.flips, true);
assert.strictEqual(tieRunner.steps, 1);
assert.strictEqual(tieRunner.to, tieRunner.name);
assert.ok(tieRunner.swings.filter((s) => s.flips).every((s) => s.to === tieRunner.name));
// A call that only the runner-up can flip: the called player's own checks pass, so `holds` must come from the runner-up.
const runnerOnly = analyzeMatch({
  result: "win",
  players: [
    { ...twin, name: "Top", role: "Gold Lane", kills: 9, deaths: 0, assists: 6, gold: 12000, damage: 80000 },
    { ...twin, name: "Next", role: "Jungle", kills: 8, deaths: 1, assists: 6, gold: 11000, damage: 70000 },
    { ...twin, name: "Rest" },
  ],
});
const runnerOnlyCheck = runnerOnly.call.sensitivity;
assert.strictEqual(runnerOnlyCheck.runnerUp.name, runnerOnly.call.runnerUp);
// The runner-up in a win is helped: deaths go down and stop at 0, so at most 1 step is tried for a 1-death game.
assert.ok(runnerOnlyCheck.runnerUp.steps <= 1, JSON.stringify(runnerOnlyCheck.runnerUp));
const anyFlip = (c) => c.flips || c.kills.flips || c.assists.flips || c.swings.some((s) => s.flips);
assert.strictEqual(runnerOnlyCheck.holds, !anyFlip(runnerOnlyCheck) && !anyFlip(runnerOnlyCheck.runnerUp));

// 14d. Kills and assists get the same 1-2-3 step check as deaths, on both players.
assert.deepStrictEqual(lossKills, { flips: false, steps: 3, to: null });
assert.deepStrictEqual(lossAssists, { flips: false, steps: 3, to: null });
// The runner-up of the example loss (Kai, 0 kills) is moved towards the blamed player: no kills to take away.
assert.strictEqual(byName(loss, lossRunner.name).kills, 0);
assert.deepStrictEqual(lossRunner.kills, { flips: false, steps: 0, to: null });
assert.deepStrictEqual(lossRunner.assists, { flips: false, steps: 3, to: null });
// A near-tie flips on a kill or an assist too, and the flip is reported with the step and the new name.
for (const stat of ["kills", "assists"]) {
  const own = nearTie.call.sensitivity[stat];
  assert.ok(own.flips && own.steps >= 1 && own.steps <= 3 && own.to === nearTie.call.runnerUp, `${stat}: ${JSON.stringify(own)}`);
  const other = tieRunner[stat];
  assert.ok(other.flips && other.steps >= 1 && other.steps <= 3 && other.to === tieRunner.name, `${stat}: ${JSON.stringify(other)}`);
}
// `holds` is only claimed when no check flips, on either player, in every sample match.
for (const a of [loss, win, avg, nearTie, runnerOnly]) {
  const s = a.call.sensitivity;
  assert.strictEqual(s.holds, !anyFlip(s) && !anyFlip(s.runnerUp));
  for (const c of [s, s.runnerUp]) {
    for (const stepped of [c, c.kills, c.assists]) {
      assert.ok(stepped.steps >= 0 && stepped.steps <= 3 && stepped.flips === (stepped.to !== null), JSON.stringify(stepped));
    }
  }
}
// A reported flip is real: replaying the reported change by hand moves the call to the reported player.
const tieKills = nearTie.call.sensitivity.kills;
const tieCalled = nearTie.players.find((p) => p.verdict === "Most to blame" || p.verdict === "MVP");
const replayed = analyzeMatch({
  result: nearTie.result,
  players: nearTie.players.map((p) => (p === tieCalled ? { ...p, kills: p.kills + (nearTie.result === "win" ? -1 : 1) * tieKills.steps } : p)),
});
assert.strictEqual(replayed.players.find((p) => p.verdict === tieCalled.verdict).name, tieKills.to);

// 14c. Every stat row carries the two numbers its result is computed from, so the worked example can be rebuilt from them.
for (const a of [loss, win, avg]) {
  for (const p of a.players) {
    for (const b of p.breakdown) {
      assert.ok(Number.isFinite(b.actual) && Number.isFinite(b.expected), `${p.name} ${b.stat}`);
      let rebuilt = b.actual / b.expected - 1;
      if (b.stat === "deaths") rebuilt = (b.expected - b.actual) / b.expected;
      if (b.stat === "kda") rebuilt = (b.actual - b.expected) / b.expected;
      assert.ok(Math.abs(Math.min(1, Math.max(-1, rebuilt)) - b.value) < 1e-9, `${p.name} ${b.stat}: ${rebuilt} vs ${b.value}`);
      assert.ok(Math.abs(4 * b.weight * b.value - b.points) < 1e-9);
    }
  }
}
// Shares can be rebuilt from the raw scores: (10 - score)^2 over the squad total in a loss, score^2 in a win.
for (const [a, weight] of [[loss, (p) => (10 - p.rawScore) ** 2], [win, (p) => p.rawScore ** 2]]) {
  const totalWeight = a.players.reduce((t, p) => t + weight(p), 0);
  for (const p of a.players) assert.ok(Math.abs(weight(p) / totalWeight - p.share) < 1e-9, p.name);
}

// 15. Squad stats: lifetime numbers, the last 5 scores, and a trend once there are older games.
const game = (result, score, verdict = "Okay") => ({ result, players: [{ name: "Darren", score, share: 0.4, verdict }, { name: "kai", score: 6, share: 0.1, verdict: "Okay" }] });
const shortHistory = [game("lose", 3, "Most to blame"), game("win", 7, "MVP")];
const shortStats = squadStats(shortHistory);
assert.deepStrictEqual(shortStats.map((s) => s.name), ["kai", "Darren"]);
const darrenShort = shortStats[1];
assert.strictEqual(darrenShort.games, 2);
assert.strictEqual(darrenShort.avg, 5);
assert.strictEqual(darrenShort.trend, null);
assert.strictEqual(darrenShort.mvp, 1);
assert.strictEqual(darrenShort.blame, 1);
assert.strictEqual(darrenShort.avgBlame, 0.4);
assert.deepStrictEqual(darrenShort.recent.map((r) => r.score), [3, 7]);
const longHistory = [game("lose", 2), game("lose", 4), ...Array.from({ length: RECENT_GAMES }, () => game("win", 8))];
const darrenLong = squadStats(longHistory).find((s) => s.name === "Darren");
assert.strictEqual(darrenLong.recent.length, RECENT_GAMES);
assert.strictEqual(darrenLong.recentAvg, 8);
assert.strictEqual(darrenLong.trend, 5);
assert.strictEqual(squadStats(longHistory).find((s) => s.name === "kai").trend, 0);
assert.deepStrictEqual(squadStats([]), []);

// 16. Import review: sane rows pass; missing values, a dropped or extra digit and absurd K/D/A are pointed at.
const { reviewRows } = require("./importer.js");
const fieldsOf = (review) => review.map((flags) => flags.map((f) => f.field));
assert.deepStrictEqual(fieldsOf(reviewRows(tidy.players)), [[], [], [], [], []]);
assert.deepStrictEqual(fieldsOf(reviewRows(win.players)), [[], [], [], [], []]);
assert.deepStrictEqual(fieldsOf(reviewRows(loss.players)), [[], [], [], [], []]);
const slipped = tidy.players.map((p) => ({ ...p }));
delete slipped[1].turret;      // OCR missed the last column
slipped[2].damage = 812000;    // extra digit
slipped[3].gold = 760;         // dropped digit
slipped[4].kills = 60;         // not a real K
const slippedReview = reviewRows(slipped);
assert.deepStrictEqual(fieldsOf(slippedReview), [[], ["turret"], ["damage"], ["gold"], ["kills"]]);
assert.strictEqual(slippedReview[1][0].text, "turret dmg is missing");
assert.strictEqual(slippedReview[2][0].text, "hero dmg 812,000 looks too high next to the others (an extra digit?)");
assert.strictEqual(slippedReview[3][0].text, "gold 760 looks too low next to the others (a dropped digit?)");
assert.strictEqual(slippedReview[4][0].text, "60 kills is unusually high");
// Partial rows list every missing box; empty rows and text-only rows are left alone; turret 0 is fine, gold 0 is not.
assert.deepStrictEqual(fieldsOf(reviewRows(partial.players)), [["damage", "taken", "turret"], ["gold", "damage", "taken", "turret"]]);
assert.deepStrictEqual(fieldsOf(reviewRows([{}, { name: "Solo" }, { kills: "", gold: "" }])), [[], [], []]);
assert.deepStrictEqual(
  fieldsOf(reviewRows([{ kills: 1, deaths: 2, assists: 3, gold: 0, damage: 5000, taken: 4000, turret: 0 }])),
  [["gold"]],
);
// A real spread between a carry and a roamer (about 8x hero damage) must not be flagged.
assert.deepStrictEqual(fieldsOf(reviewRows(win.players.map((p) => (p.name === "E" ? { ...p, damage: 15000 } : p)))), [[], [], [], [], []]);

for (const [label, a] of [["loss", loss], ["win", win]]) {
  console.log(`\n${label}:`);
  for (const p of [...a.players].sort((x, y) => y.share - x.share)) {
    console.log(`  ${p.name.padEnd(8)} ${p.role.padEnd(10)} score ${p.score.toFixed(1)}  share ${Math.round(p.share * 100)}%  ${p.verdict}`);
  }
}
console.log("\nAll tests passed.");
