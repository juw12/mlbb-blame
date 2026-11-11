// MLBB match scoring: role-aware impact score (0-10) per player, plus blame / reward shares.
// Pure functions, no DOM - used by index.html and test.js.

const ROLES = ["Gold Lane", "EXP Lane", "Mid Lane", "Jungle", "Roam"];

// Typical share of the team's total for each stat, by role (each column sums to ~1 for a standard 5-role team).
const EXPECTED_SHARE = {
  gold:   { "Gold Lane": 0.24, "EXP Lane": 0.20, "Mid Lane": 0.21, "Jungle": 0.24, "Roam": 0.11 },
  damage: { "Gold Lane": 0.24, "EXP Lane": 0.18, "Mid Lane": 0.25, "Jungle": 0.22, "Roam": 0.11 },
  taken:  { "Gold Lane": 0.14, "EXP Lane": 0.27, "Mid Lane": 0.14, "Jungle": 0.18, "Roam": 0.27 },
  turret: { "Gold Lane": 0.32, "EXP Lane": 0.20, "Mid Lane": 0.16, "Jungle": 0.20, "Roam": 0.12 },
  deaths: { "Gold Lane": 0.17, "EXP Lane": 0.22, "Mid Lane": 0.19, "Jungle": 0.18, "Roam": 0.24 },
};

// Typical kill participation ((K + A) / team kills) by role.
const EXPECTED_KP = { "Gold Lane": 0.60, "EXP Lane": 0.55, "Mid Lane": 0.65, "Jungle": 0.65, "Roam": 0.70 };

// Good (K + A) / D ratio.
// KDA a decent game reaches, per role (app estimates, not Moonton data).
// Tanks and EXP laners trade their life for the team, so their target is lower.
const KDA_TARGET = { "Gold Lane": 3, "EXP Lane": 2.5, "Mid Lane": 3, "Jungle": 3, "Roam": 2.5 };

// How much each stat matters for each role (each row sums to 1).
const WEIGHTS = {
  "Gold Lane": { gold: 0.15, damage: 0.25, taken: 0.05, turret: 0.20, kp: 0.10, deaths: 0.15, kda: 0.10 },
  "EXP Lane":  { gold: 0.10, damage: 0.15, taken: 0.25, turret: 0.10, kp: 0.15, deaths: 0.15, kda: 0.10 },
  "Mid Lane":  { gold: 0.10, damage: 0.30, taken: 0.05, turret: 0.05, kp: 0.20, deaths: 0.15, kda: 0.15 },
  "Jungle":    { gold: 0.20, damage: 0.20, taken: 0.10, turret: 0.10, kp: 0.15, deaths: 0.15, kda: 0.10 },
  "Roam":      { gold: 0.00, damage: 0.10, taken: 0.25, turret: 0.05, kp: 0.30, deaths: 0.15, kda: 0.15 },
};

const LABELS = {
  gold: "Gold", damage: "Hero damage", taken: "Damage taken", turret: "Turret damage",
  kp: "Kill participation", deaths: "Deaths", kda: "KDA",
};

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const sum = (values) => values.reduce((total, value) => total + value, 0);
const pct = (value) => `${Math.round(value * 100)}%`;

// Share-type stat: +1 at double the expected share, -1 at zero.
function shareScore(actual, expected) {
  return expected > 0 ? clamp(actual / expected - 1, -1, 1) : 0;
}

function analyzeMatch(match) {
  const players = match.players;
  const total = (key) => sum(players.map((p) => p[key]));
  const totals = {
    kills: total("kills"), deaths: total("deaths"), gold: total("gold"),
    damage: total("damage"), taken: total("taken"), turret: total("turret"),
  };

  // Re-normalise expected shares over the roles actually present (handles duplicate roles / fewer players).
  const expectedShare = {};
  for (const stat of Object.keys(EXPECTED_SHARE)) {
    const roleSum = sum(players.map((p) => EXPECTED_SHARE[stat][p.role]));
    expectedShare[stat] = (role) => EXPECTED_SHARE[stat][role] / roleSum;
  }

  const results = players.map((p) => {
    const share = (stat, value) => (totals[stat] > 0 ? value / totals[stat] : 0);
    const kp = totals.kills > 0 ? (p.kills + p.assists) / totals.kills : 0;
    const kda = (p.kills + p.assists) / Math.max(1, p.deaths);
    const deathShare = share("deaths", p.deaths);
    const expDeath = expectedShare.deaths(p.role);

    const stats = {
      gold:   { actual: share("gold", p.gold),     expected: expectedShare.gold(p.role) },
      damage: { actual: share("damage", p.damage), expected: expectedShare.damage(p.role) },
      taken:  { actual: share("taken", p.taken),   expected: expectedShare.taken(p.role) },
      turret: { actual: share("turret", p.turret), expected: expectedShare.turret(p.role) },
      kp:     { actual: kp, expected: EXPECTED_KP[p.role] },
      deaths: { actual: deathShare, expected: expDeath },
      kda:    { actual: kda, expected: KDA_TARGET[p.role] },
    };
    for (const stat of ["gold", "damage", "taken", "turret", "kp"]) {
      stats[stat].value = shareScore(stats[stat].actual, stats[stat].expected);
    }
    // Fewer deaths than expected is good; no team deaths at all counts as mildly good for everyone.
    stats.deaths.value = totals.deaths > 0 ? clamp((expDeath - deathShare) / expDeath, -1, 1) : 0.5;
    stats.kda.value = clamp((kda - KDA_TARGET[p.role]) / KDA_TARGET[p.role], -1, 1);

    const weights = WEIGHTS[p.role];
    const breakdown = Object.keys(stats).map((stat) => ({
      stat,
      label: LABELS[stat],
      weight: weights[stat],
      value: stats[stat].value,
      impact: weights[stat] * stats[stat].value,
      text: describe(stat, stats[stat], p),
    }));
    const score = clamp(6 + 4 * sum(breakdown.map((b) => b.impact)), 0, 10);
    return { ...p, kp, kda, score: Math.round(score * 10) / 10, rawScore: score, breakdown };
  });

  assignVerdicts(results, match.result);
  const ranked = [...results].sort((a, b) => b.rawScore - a.rawScore);
  return { result: match.result, totals, players: results, call: callConfidence(ranked, match.result === "win") };
}

function describe(stat, s, p) {
  switch (stat) {
    case "gold":   return `${pct(s.actual)} of team gold (≈${pct(s.expected)} expected for ${p.role})`;
    case "damage": return `${pct(s.actual)} of team hero damage (≈${pct(s.expected)} expected)`;
    case "taken":  return `${pct(s.actual)} of team damage taken (≈${pct(s.expected)} expected)`;
    case "turret": return `${pct(s.actual)} of team turret damage (≈${pct(s.expected)} expected)`;
    case "kp":     return `${pct(s.actual)} kill participation (≈${pct(s.expected)} expected)`;
    case "deaths": return `${p.deaths} deaths = ${pct(s.actual)} of team deaths (≈${pct(s.expected)} expected)`;
    case "kda":    return `KDA ${s.actual.toFixed(1)} (target ${s.expected} for this role)`;
  }
}

// Round fractions (summing to 1) to whole percents that sum to exactly 100 (largest remainder).
function roundedPercents(fractions) {
  const raw = fractions.map((f) => f * 100);
  const floors = raw.map(Math.floor);
  let missing = 100 - sum(floors);
  const order = raw.map((value, i) => [value - floors[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors;
}

// How clear the call is: score gap between the blamed (or MVP) player and the runner-up.
function callConfidence(ranked, won) {
  if (ranked.length < 2) return { gap: 0, label: "Only one player" };
  const gap = won
    ? ranked[0].rawScore - ranked[1].rawScore
    : ranked[ranked.length - 2].rawScore - ranked[ranked.length - 1].rawScore;
  let label = "Close call - could go either way";
  if (gap >= 1) label = "Clear call";
  else if (gap >= 0.4) label = "Fairly clear call";
  return { gap: Math.round(gap * 10) / 10, label };
}

// Win: reward share ∝ score². Loss: blame share ∝ (10 - score)².
function assignVerdicts(results, outcome) {
  const won = outcome === "win";
  const weights = results.map((r) => (won ? r.rawScore ** 2 : (10 - r.rawScore) ** 2));
  const weightSum = sum(weights) || 1;
  const percents = roundedPercents(weights.map((w) => w / weightSum));
  results.forEach((r, i) => {
    r.share = weights[i] / weightSum;
    r.sharePct = percents[i];
  });

  const ranked = [...results].sort((a, b) => b.rawScore - a.rawScore);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  for (const r of results) {
    const sorted = [...r.breakdown].sort((a, b) => a.impact - b.impact);
    r.weaknesses = sorted.filter((b) => b.impact < -0.02).slice(0, 3);
    r.strengths = sorted.reverse().filter((b) => b.impact > 0.02).slice(0, 3);

    if (won) {
      if (r === best) r.verdict = "MVP";
      else if (r.score >= 7) r.verdict = "Carried";
      else if (r.score >= 5.5) r.verdict = "Solid";
      else r.verdict = "Got carried";
    } else {
      if (r === worst) r.verdict = "Most to blame";
      else if (r === best) r.verdict = "MVP (lose)";
      else if (r.score >= 7) r.verdict = "Not your fault";
      else if (r.score >= 5.5) r.verdict = "Okay";
      else r.verdict = "Also guilty";
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = { analyzeMatch, roundedPercents, ROLES };
}
