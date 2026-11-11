"""Council helper. Snapshots the app source for a tag and runs council score or pair.

python hone/judge.py snapshot <tag>          -> hone/versions/<tag>.md (source bundle for the judges)
python hone/judge.py score <tag>             -> hone/shots/<tag>/score.json
python hone/judge.py pair <best> <candidate> -> hone/shots/<candidate>/pair_vs_<best>.json
"""
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
HONE = APP / "hone"
PY = sys.executable
COUNCIL = Path.home() / ".vector/skills/hone/council/council.py"
SOURCES = ["index.html", "scoring.js", "importer.js", "sw.js"]  # sw.js exists from v5 on
SHOTS = ["result_390.png", "result_1280.png", "idle_390.png"]


def snapshot(tag):
    versions = HONE / "versions"
    versions.mkdir(exist_ok=True)
    parts = [
        f"# MLBB Blame & MVP Analyzer - version {tag}",
        "Static web app opened in a phone or desktop browser right after a Mobile Legends match.",
        "Screenshots attached: result state at 390 px (phone) and 1280 px, idle state at 390 px.",
    ]
    source_dir = HONE / "versions" / f"{tag}_files"
    if not source_dir.exists():
        source_dir = APP
    for name in SOURCES:
        if (source_dir / name).exists():
            parts.append(f"\n## {name}\n```\n{(source_dir / name).read_text(encoding='utf-8')}\n```")
    path = versions / f"{tag}.md"
    path.write_text("\n".join(parts), encoding="utf-8")
    return path


def images(tag, flag):
    shots = [str(HONE / "shots" / tag / name) for name in SHOTS if (HONE / "shots" / tag / name).exists()]
    return [flag] + shots if shots else []


def main():
    action = sys.argv[1]
    if action == "snapshot":
        print(snapshot(sys.argv[2]))
        return
    if action == "score":
        tag = sys.argv[2]
        artifact = snapshot(tag)
        command = [
            PY, str(COUNCIL), "score",
            "--rubric", str(HONE / "rubric.md"),
            "--artifact", str(artifact),
            "--out", str(HONE / "shots" / tag / "score.json"),
            "--log", str(HONE / "council_log.md"),
        ] + images(tag, "--image")
    else:
        best, candidate = sys.argv[2], sys.argv[3]
        command = [
            PY, str(COUNCIL), "pair",
            "--rubric", str(HONE / "rubric.md"),
            "--a", str(snapshot(best) if not (HONE / "versions" / f"{best}.md").exists() else HONE / "versions" / f"{best}.md"),
            "--b", str(snapshot(candidate)),
            "--out", str(HONE / "shots" / candidate / f"pair_vs_{best}.json"),
            "--log", str(HONE / "council_log.md"),
        ] + images(best, "--image-a") + images(candidate, "--image-b")
    command += ["--timeout", "150"]
    log_path = HONE / "shots" / f"council_{action}_{sys.argv[-1]}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as log_file:
        process = subprocess.Popen(
            command,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
    print(f"started pid {process.pid}, log {log_path}")


if __name__ == "__main__":
    main()
