// Turns pasted or OCR'd end-of-match text into player rows.
// Pure function, no DOM: runs in the browser and in node (test.js).
//
// Expected shape, one player per line (extra text and columns are tolerated):
//   Darren  Fanny  Jungle  2/11/3  7600  38.7k  47,800  800
// - Text before the K/D/A is "name", then optionally "hero" and a role word.
// - The K/D/A must use separators (2/11/3, 2|11|3, 2-11-3).
// - The numbers after it are read in the app's column order:
//   gold, hero damage, damage taken, turret damage.
// - Percentages (teamfight %), small decimals (KDA ratio 4.3, medal score 8.6) are skipped.
// - OCR often puts the name on its own line above the numbers; a text-only line
//   followed by a K/D/A line is treated as that player's name.

const IMPORT_FIELDS = ["gold", "damage", "taken", "turret"];
const FIELD_LABELS = { gold: "gold", damage: "hero dmg", taken: "dmg taken", turret: "turret dmg" };
// Header / UI words that are never a player name.
const HEADER_WORDS = /\b(k\/d\/a|kda|gold|hero|damage|dmg|taken|turret|tower|data|victory|defeat|player|teamfight|score|mvp|statistics|overview)\b/i;

const ROLE_WORDS = [
  [/\bgold(?:\s*lane(?:r)?)?\b|\bmarksman\b|\bmm\b/i, "Gold Lane"],
  [/\bexp(?:\s*lane(?:r)?)?\b|\bfighter\b/i, "EXP Lane"],
  [/\bmid(?:\s*lane(?:r)?)?\b|\bmage\b/i, "Mid Lane"],
  [/\bjungl(?:e|er)\b|\bjg\b/i, "Jungle"],
  [/\broam(?:er)?\b|\btank\b|\bsupport\b/i, "Roam"],
];

const KDA_PATTERN = /(\d{1,2})\s*[\/|\\-]\s*(\d{1,2})\s*[\/|\\-]\s*(\d{1,2})/;
const NUMBER_PATTERN = /\d[\d,.]*\s*k?(?![\d%])/gi;

// Hero names, used to split "Darren Fanny" when OCR or Live Text collapses the column gap.
// Unknown or brand-new heroes simply stay part of the name; the user can fix the field.
const HEROES = [
  "Miya", "Balmond", "Saber", "Alice", "Nana", "Tigreal", "Alucard", "Karina", "Akai", "Franco", "Bane", "Bruno",
  "Clint", "Rafaela", "Eudora", "Zilong", "Fanny", "Layla", "Minotaur", "Lolita", "Hayabusa", "Freya", "Gord",
  "Natalia", "Kagura", "Chou", "Sun", "Alpha", "Ruby", "Yi Sun-shin", "Moskov", "Johnson", "Cyclops", "Estes",
  "Hilda", "Aurora", "Lapu-Lapu", "Vexana", "Roger", "Karrie", "Gatotkaca", "Harley", "Irithel", "Grock", "Argus",
  "Odette", "Lancelot", "Diggie", "Hylos", "Zhask", "Helcurt", "Pharsa", "Lesley", "Jawhead", "Angela", "Gusion",
  "Valir", "Martis", "Uranus", "Hanabi", "Chang'e", "Kaja", "Selena", "Aldous", "Claude", "Vale", "Leomord",
  "Lunox", "Hanzo", "Belerick", "Kimmy", "Thamuz", "Harith", "Minsitthar", "Kadita", "Faramis", "Badang", "Khufra",
  "Granger", "Guinevere", "Esmeralda", "Terizla", "X.Borg", "Ling", "Dyrroth", "Lylia", "Baxia", "Masha", "Wanwan",
  "Silvanna", "Cecilion", "Carmilla", "Atlas", "Popol and Kupa", "Yu Zhong", "Luo Yi", "Benedetta", "Khaleed",
  "Barats", "Brody", "Yve", "Mathilda", "Paquito", "Gloo", "Beatrix", "Phoveus", "Natan", "Aulus", "Aamon",
  "Valentina", "Edith", "Floryn", "Yin", "Melissa", "Xavier", "Julian", "Fredrinn", "Joy", "Novaria", "Arlott",
  "Ixia", "Nolan", "Cici", "Chip", "Zhuxin", "Suyou", "Lukas", "Kalea", "Zetian", "Obsidia", "Sora",
];
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const HERO_BY_KEY = new Map(HEROES.map((h) => [squash(h), h]));

// "Darren Fanny" -> { name: "Darren", hero: "Fanny" }; "AhBeng YuZhong" -> hero "Yu Zhong".
function splitTrailingHero(chunk) {
  const words = chunk.split(/\s+/);
  for (let take = Math.min(3, words.length - 1); take >= 1; take--) {
    const hero = HERO_BY_KEY.get(squash(words.slice(-take).join("")));
    if (hero) return { name: words.slice(0, -take).join(" "), hero };
  }
  return null;
}

function canonicalHero(text) {
  return HERO_BY_KEY.get(squash(text)) || text;
}

// Common OCR swaps inside numbers: O->0, l/I->1, S->5, B->8.
// Only touches tokens that contain a digit and whose letters are all look-alikes
// ("7O00", "8OO", "2/O/5"), so names such as "Oscar", "Ilya" or "l33t" are left alone.
const OCR_SWAPS = { O: "0", o: "0", l: "1", I: "1", S: "5", B: "8" };
function fixOcrDigits(line) {
  return line.replace(/\S+/g, (token) => {
    const letters = token.match(/\p{L}/gu) || [];
    if (!letters.length || !/\d/.test(token) || /k$/i.test(token)) return token;
    if (!letters.every((c) => c in OCR_SWAPS)) return token;
    return token.replace(/[OolISB]/g, (c) => OCR_SWAPS[c]);
  });
}

function parseAmount(token) {
  const t = token.toLowerCase().replace(/\s+/g, "");
  const thousands = t.endsWith("k");
  let core = t.replace(/k$/, "");
  if (thousands) {
    return Math.round(Number(core.replace(/,/g, ".")) * 1000);
  }
  // "47,800" / "47.800" (thousands separators) vs "4.3" (a ratio).
  if (/^\d{1,3}([,.]\d{3})+$/.test(core)) {
    core = core.replace(/[,.]/g, "");
  }
  return Number(core.replace(/,/g, ""));
}

function isRatioLike(token) {
  const t = token.toLowerCase().replace(/\s+/g, "");
  if (t.endsWith("k")) return false;
  if (/^\d{1,3}([,.]\d{3})+$/.test(t)) return false;
  return /[.,]/.test(t) && Number(t.replace(",", ".")) < 30;
}

function splitIdentity(text, nameLine) {
  let rest = text;
  let role = "";
  for (const [pattern, name] of ROLE_WORDS) {
    if (pattern.test(rest)) {
      role = name;
      rest = rest.replace(pattern, " ");
      break;
    }
  }
  // Separators between name and hero: tab, 2+ spaces, "·", "|", " - ", ",".
  const chunks = rest
    .split(/\t|\s{2,}|·|\||\s-\s|,/)
    .map((c) => c.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.)]+$/gu, "").trim())
    .filter(Boolean);
  // OCR layout: name on the line above, hero next to the K/D/A.
  if (nameLine && chunks.length < 2) {
    return { name: nameLine, hero: canonicalHero(chunks[0] || ""), role };
  }
  if (chunks.length === 1) {
    const split = splitTrailingHero(chunks[0]);
    if (split) return { ...split, role };
  }
  return { name: chunks[0] || "", hero: canonicalHero(chunks[1] || ""), role };
}

function parseStatsText(input) {
  const lines = String(input || "")
    .split(/\r?\n/)
    .map((l) => fixOcrDigits(l).trim())
    .filter(Boolean);
  const players = [];
  const warnings = [];
  let pendingText = "";
  let current = null;

  const finish = () => {
    if (!current) return;
    const kept = current.numbers.slice(0, IMPORT_FIELDS.length);
    IMPORT_FIELDS.forEach((field, i) => {
      if (kept[i] !== undefined) current.player[field] = kept[i];
    });
    if (kept.length < IMPORT_FIELDS.length) {
      const missing = IMPORT_FIELDS.slice(kept.length).map((f) => FIELD_LABELS[f]).join(", ");
      warnings.push(`${current.player.name || `Player ${players.length + 1}`}: no ${missing} found`);
    }
    players.push(current.player);
    current = null;
  };

  const collectNumbers = (segment) => {
    const found = [];
    for (const match of segment.matchAll(NUMBER_PATTERN)) {
      const token = match[0].trim().replace(/[,.]+$/, "");
      if (!token) continue;
      if (isRatioLike(token)) continue;
      const value = parseAmount(token);
      if (Number.isFinite(value)) found.push(value);
    }
    return found;
  };

  for (const line of lines) {
    const kda = line.match(KDA_PATTERN);
    if (kda) {
      finish();
      if (players.length >= 5) break;
      const before = line.slice(0, kda.index);
      const after = line.slice(kda.index + kda[0].length).replace(/\d+(?:[.,]\d+)?\s*%/g, " ");
      const identity = /\p{L}/u.test(before)
        ? splitIdentity(before.trim(), pendingText)
        : splitIdentity(pendingText, "");
      pendingText = "";
      current = {
        player: {
          name: identity.name,
          hero: identity.hero,
          role: identity.role,
          kills: Number(kda[1]),
          deaths: Number(kda[2]),
          assists: Number(kda[3]),
        },
        numbers: collectNumbers(after),
      };
      continue;
    }
    const hasLetters = /\p{L}{2,}/u.test(line);
    const numbersOnly = !hasLetters && /\d/.test(line);
    if (current && numbersOnly && current.numbers.length < IMPORT_FIELDS.length) {
      current.numbers.push(...collectNumbers(line.replace(/\d+(?:[.,]\d+)?\s*%/g, " ")));
    } else if (hasLetters) {
      // Possible name line for the next player; headers and long sentences are not names.
      const candidate = line.replace(/\d+(?:[.,]\d+)?\s*%/g, " ").replace(NUMBER_PATTERN, " ").trim();
      const words = candidate.split(/\s+/).filter(Boolean);
      pendingText = !HEADER_WORDS.test(candidate) && words.length <= 3 ? candidate : "";
    }
  }
  finish();

  if (!players.length) {
    warnings.push("No K/D/A like 5/2/7 found. Put one player per line: name, hero, K/D/A, gold, hero dmg, dmg taken, turret dmg.");
  }
  const text = String(input || "");
  const result = /\bvictory\b/i.test(text) ? "win" : /\bdefeat\b/i.test(text) ? "lose" : null;
  return { players, warnings, result };
}

if (typeof module !== "undefined") {
  module.exports = { parseStatsText, IMPORT_FIELDS };
}
