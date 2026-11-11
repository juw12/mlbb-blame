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
const fmt = (value) => Math.round(value).toLocaleString("en-US");
// Role expectations are estimates, so show them to 2 significant figures (10,512 -> 11,000).
const approx = (value) => (value >= 100 ? fmt(Number(value.toPrecision(2))) : fmt(value));

// Share-type stat: +1 at double the expected share, -1 at zero.
function shareScore(actual, expected) {
  return expected > 0 ? clamp(actual / expected - 1, -1, 1) : 0;
}

// Stats that can be left blank for the whole squad (the post-match screen does not always show them).
const OPTIONAL_STATS = ["gold", "damage", "taken", "turret"];
const leftOut = (stat) => `${LABELS[stat]} not entered for anyone - left out of the score`;

// Score every player (no verdicts yet). Returns { totals, results }.
function scorePlayers(players) {
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
    // A column nobody filled in (team total 0) is left out: it counts as "as expected" for everyone
    // instead of -1, which would hit roles unevenly because their weights for that stat differ.
    for (const stat of OPTIONAL_STATS) {
      if (totals[stat] > 0) continue;
      stats[stat].value = 0;
      stats[stat].skipped = true;
    }
    // Fewer deaths than expected is good; no team deaths at all counts as mildly good for everyone.
    stats.deaths.value = totals.deaths > 0 ? clamp((expDeath - deathShare) / expDeath, -1, 1) : 0.5;
    stats.kda.value = clamp((kda - KDA_TARGET[p.role]) / KDA_TARGET[p.role], -1, 1);

    const weights = WEIGHTS[p.role];
    const breakdown = Object.keys(stats).map((stat) => ({
      stat,
      label: LABELS[stat],
      weight: weights[stat],
      actual: stats[stat].actual,
      expected: stats[stat].expected,
      value: stats[stat].value,
      skipped: Boolean(stats[stat].skipped),
      impact: weights[stat] * stats[stat].value,
      points: 4 * weights[stat] * stats[stat].value,
      text: stats[stat].skipped ? leftOut(stat) : describe(stat, stats[stat], p, totals),
      brief: stats[stat].skipped ? leftOut(stat) : describeBrief(stat, stats[stat], p),
      short: describeShort(stat, stats[stat], p),
    }));
    const score = clamp(6 + 4 * sum(breakdown.map((b) => b.impact)), 0, 10);
    return { ...p, kp, kda, score: Math.round(score * 10) / 10, rawScore: score, breakdown };
  });
  return { totals, results };
}

// The player the call lands on: best score in a win, worst score in a loss.
function topIndex(results, won) {
  const ranked = results.map((r, i) => [r.rawScore, i]).sort((a, b) => b[0] - a[0]);
  return won ? ranked[0][1] : ranked[ranked.length - 1][1];
}

function analyzeMatch(match) {
  const won = match.result === "win";
  const { totals, results } = scorePlayers(match.players);
  assignVerdicts(results, match.result);
  const ranked = [...results].sort((a, b) => b.rawScore - a.rawScore);
  const call = callConfidence(ranked, won);
  if (ranked.length >= 2) {
    const top = won ? ranked[0] : ranked[ranked.length - 1];
    const next = won ? ranked[1] : ranked[ranked.length - 2];
    call.deciders = deciders(top, next, won);
    call.sensitivity = callSensitivity(match.players, won);
  }
  return { result: match.result, totals, players: results, call };
}

// Full sentence with the raw number, its share and what the role would normally have.
function describe(stat, s, p, totals) {
  const about = (key) => `about ${approx(s.expected * totals[key])}`;
  switch (stat) {
    case "gold":   return `${fmt(p.gold)} gold = ${pct(s.actual)} of team gold (≈${pct(s.expected)} expected for ${p.role}, ${about("gold")})`;
    case "damage": return `${fmt(p.damage)} hero damage = ${pct(s.actual)} of team (≈${pct(s.expected)} expected, ${about("damage")})`;
    case "taken":  return `${fmt(p.taken)} damage taken = ${pct(s.actual)} of team (≈${pct(s.expected)} expected, ${about("taken")})`;
    case "turret": return `${fmt(p.turret)} turret damage = ${pct(s.actual)} of team (≈${pct(s.expected)} expected, ${about("turret")})`;
    case "kp":     return `In ${p.kills + p.assists} of ${totals.kills} team kills = ${pct(s.actual)} kill participation (≈${pct(s.expected)} expected)`;
    case "deaths": return `${p.deaths} deaths = ${pct(s.actual)} of team deaths (≈${pct(s.expected)} expected, ${about("deaths")})`;
    case "kda":    return `KDA ${s.actual.toFixed(1)} from ${p.kills}/${p.deaths}/${p.assists} (target ${s.expected} for this role)`;
  }
}

// [value, unit] for side-by-side comparisons: ["11", "deaths"], ["66%", "of their role's usual gold"].
// Share stats are shown against the role's usual share so a Roam and a Jungler can be compared fairly.
function describeShort(stat, s, p) {
  switch (stat) {
    case "kp":     return [pct(s.actual), "kill participation"];
    case "deaths": return [String(p.deaths), "deaths"];
    case "kda":    return [s.actual.toFixed(1), "KDA"];
    default:       return [s.skipped ? "–" : pct(s.expected > 0 ? s.actual / s.expected : 0), `of their role's usual ${LABELS[stat].toLowerCase()}`];
  }
}

// Short version without raw numbers, for the share image.
function describeBrief(stat, s, p) {
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
const CLEAR_GAP = 1;    // 1+ impact point between the top two = "Clear call"
const MARGIN_GAP = 0.4; // under this the top two are within the margin = "Close call"
function callConfidence(ranked, won) {
  if (ranked.length < 2) return { gap: 0, label: "Only one player", close: false, runnerUp: null };
  const top = won ? ranked[0] : ranked[ranked.length - 1];
  const next = won ? ranked[1] : ranked[ranked.length - 2];
  const gap = Math.abs(top.rawScore - next.rawScore);
  let label = "Close call - could go either way";
  if (gap >= CLEAR_GAP) label = "Clear call";
  else if (gap >= MARGIN_GAP) label = "Fairly clear call";
  // Everyone (other than the top player) whose score is within the margin of the top player.
  for (const r of ranked) {
    r.withinMargin = r !== top && Math.abs(r.rawScore - top.rawScore) < MARGIN_GAP;
  }
  return {
    gap: Math.round(gap * 10) / 10,
    label,
    close: gap < MARGIN_GAP,
    runnerUp: next.name,
    runnerUpScore: Math.round(next.rawScore * 10) / 10,
  };
}

// The stats that separate the called player from the runner-up, biggest gap in score points first.
function deciders(top, next, won) {
  return top.breakdown
    .map((b, i) => {
      const other = next.breakdown[i];
      const points = won ? b.points - other.points : other.points - b.points;
      const [mine, unit] = b.short;
      const [theirs] = other.short;
      const text = unit === "KDA" ? `KDA ${mine} vs ${theirs}` : `${mine} vs ${theirs} ${unit}`;
      return { stat: b.stat, label: b.label, points, text };
    })
    .filter((d) => d.points > 0.05)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2);
}

// Would the call survive a slightly different game? The same checks are run on both players
// the call hangs on, one player and one stat at a time:
// 1. deaths, kills and assists each changed by 1, 2 and 3: the first change that flips the call is reported;
// 2. gold, hero damage, damage taken and turret damage each moved by 10%.
// The called player is moved towards the runner-up (better in a loss, worse in a win) and the
// runner-up is moved towards the called player (worse in a loss, better in a win).
const SENSITIVITY_STEPS = 3;
const SENSITIVITY_SWING = 0.1;
const SWING_STATS = ["gold", "damage", "taken", "turret"];
function callSensitivity(players, won) {
  const ranked = scorePlayers(players).results.map((r, i) => [r.rawScore, i]).sort((a, b) => b[0] - a[0]);
  const original = won ? ranked[0][1] : ranked[ranked.length - 1][1];
  const runner = won ? ranked[1][1] : ranked[ranked.length - 2][1];

  // Change one player's stats and see who the call lands on. `better` = the change improves their score.
  const check = (who, better) => {
    const callAfter = (change) => {
      const changed = players.map((p, i) => (i === who ? { ...p, ...change } : p));
      return topIndex(scorePlayers(changed).results, won);
    };
    const factor = better ? 1 + SENSITIVITY_SWING : 1 - SENSITIVITY_SWING;
    const swings = SWING_STATS.map((stat) => {
      const now = callAfter({ [stat]: players[who][stat] * factor });
      return { stat, label: LABELS[stat].toLowerCase(), flips: now !== original, to: now !== original ? players[now].name : null };
    });
    // Move one counted stat by 1, 2, 3 (never below 0) and stop at the first change that flips the call.
    const stepCheck = (stat, direction) => {
      const result = { flips: false, steps: 0, to: null };
      for (let n = 1; n <= SENSITIVITY_STEPS; n++) {
        const value = players[who][stat] + direction * n;
        if (value < 0) break;
        result.steps = n;
        const now = callAfter({ [stat]: value });
        if (now !== original) {
          result.flips = true;
          result.to = players[now].name;
          break;
        }
      }
      return result;
    };
    // Fewer deaths is better; more kills and more assists are better. Deaths stay at the top level.
    return {
      ...stepCheck("deaths", better ? -1 : 1),
      kills: stepCheck("kills", better ? 1 : -1),
      assists: stepCheck("assists", better ? 1 : -1),
      swings,
    };
  };

  const called = check(original, !won);
  const runnerUp = { name: players[runner].name, ...check(runner, won) };
  const anyFlip = (c) => c.flips || c.kills.flips || c.assists.flips || c.swings.some((s) => s.flips);
  return { ...called, swing: SENSITIVITY_SWING, runnerUp, holds: !anyFlip(called) && !anyFlip(runnerUp) };
}

// Squad leaderboard from saved matches: lifetime numbers plus the last RECENT_GAMES as a trend.
const RECENT_GAMES = 5;
function squadStats(history) {
  const byName = {};
  for (const match of history) {
    for (const p of match.players) {
      const key = p.name.toLowerCase();
      const s = byName[key] ||= { name: p.name, games: 0, wins: 0, losses: 0, mvp: 0, blame: 0, blameShare: 0, log: [] };
      s.games++;
      s.log.push({ score: p.score, result: match.result });
      if (match.result === "win") s.wins++;
      else {
        s.losses++;
        s.blameShare += p.share;
      }
      if (p.verdict === "MVP" || p.verdict === "MVP (lose)") s.mvp++;
      if (p.verdict === "Most to blame") s.blame++;
    }
  }
  const mean = (entries) => sum(entries.map((e) => e.score)) / entries.length;
  return Object.values(byName).map((s) => {
    const recent = s.log.slice(-RECENT_GAMES);
    const earlier = s.log.slice(0, -RECENT_GAMES);
    return {
      name: s.name, games: s.games, wins: s.wins, losses: s.losses, mvp: s.mvp, blame: s.blame,
      avg: mean(s.log),
      avgBlame: s.losses ? s.blameShare / s.losses : null,
      recent,
      recentAvg: mean(recent),
      // Last 5 against the games before them; null until there are older games to compare with.
      trend: earlier.length ? mean(recent) - mean(earlier) : null,
    };
  }).sort((a, b) => b.avg - a.avg);
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
  module.exports = { analyzeMatch, roundedPercents, squadStats, ROLES, CLEAR_GAP, MARGIN_GAP, RECENT_GAMES };
}
