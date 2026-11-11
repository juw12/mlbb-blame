// Run: node test.js
const assert = require("assert");
const { analyzeMatch, roundedPercents } = require("./scoring.js");

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

// 5. Displayed whole percents always sum to exactly 100 (example loss used to show 101).
for (const a of [loss, win, avg, edge]) {
  assert.strictEqual(a.players.reduce((t, p) => t + p.sharePct, 0), 100);
}
assert.deepStrictEqual(roundedPercents([1 / 3, 1 / 3, 1 / 3]).sort(), [33, 33, 34]);

// 6. Confidence of the call: Darren is far behind the runner-up -> clear call; equal scores -> close call.
assert.strictEqual(loss.call.label, "Clear call");
assert.ok(edge.call.label.startsWith("Close call"));

for (const [label, a] of [["loss", loss], ["win", win]]) {
  console.log(`\n${label}:`);
  for (const p of [...a.players].sort((x, y) => y.share - x.share)) {
    console.log(`  ${p.name.padEnd(8)} ${p.role.padEnd(10)} score ${p.score.toFixed(1)}  share ${Math.round(p.share * 100)}%  ${p.verdict}`);
  }
}
console.log("\nAll tests passed.");
