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

for (const [label, a] of [["loss", loss], ["win", win]]) {
  console.log(`\n${label}:`);
  for (const p of [...a.players].sort((x, y) => y.share - x.share)) {
    console.log(`  ${p.name.padEnd(8)} ${p.role.padEnd(10)} score ${p.score.toFixed(1)}  share ${Math.round(p.share * 100)}%  ${p.verdict}`);
  }
}
console.log("\nAll tests passed.");
