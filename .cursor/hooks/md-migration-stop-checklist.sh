#!/usr/bin/env bash
# stop — remind the agent of MD→extension migration hard gates (fail-open).
# Emits a follow-up only once per conversation, and only when the transcript
# looks like a module migration session — otherwise print {} and let the turn end.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MD_ROOT="$(cd "$ROOT/../management-dashboard" 2>/dev/null && pwd || true)"
HOOK_INPUT="$(cat || true)"
export HOOK_INPUT
export MD_EXTENSIONS_ROOT="$ROOT"
export MD_DASHBOARD_ROOT="$MD_ROOT"

python3 <<'PY'
import glob
import json
import os
import re
import subprocess
import sys

root = os.environ.get("MD_EXTENSIONS_ROOT", "")
md_root = os.environ.get("MD_DASHBOARD_ROOT", "") or ""
raw = os.environ.get("HOOK_INPUT", "")

try:
    payload = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    payload = {}

status = payload.get("status") or "completed"
loop_count = payload.get("loop_count")
if loop_count is None:
    loop_count = 0
try:
    loop_count = int(loop_count)
except (TypeError, ValueError):
    loop_count = 0

# Never auto-continue after the first reminder (breaks infinite stop loops).
if status != "completed" or loop_count > 0:
    print("{}")
    sys.exit(0)

checklist = """If this session migrated an MD module to md-extensions, verify before finishing:
1) Federation triangle: vite name ≡ route key ≡ ExternalModule moduleName
2) MD Phase 3: VITE_{MODULE}_URL in all .env.* + route wiring (Mode A url or Mode B GateComponent)
3) Anti-patterns in src/ only (exclude *.md): no primereact/MdDataTable/useTenant/VITE_API_BASE_URL/AppState.permissions
4) UI: lean InputField from U&G shared/, CL styles only at RemoteComponent
5) Scaffold: scrub product leftovers; keep U&G .gitignore env rules; diff -rq vs pilot for unexpected src drift
6) Cleanup: retain MD files still imported by sibling routes (e.g. Customer Groups)
7) Lockfile: published CL semver (no file:/link); Firebase sites created before first deploy
8) QA: extension typecheck+lint+test:run+build:dev; update playbook decisions log
Skill: md-module-extraction | Docs: MODULE_MIGRATION_PLAYBOOK.md + REUSABLE_FROM_USERS_AND_GROUPS.md"""

MIGRATION_RE = re.compile(
    r"(?i)("
    r"md-module-extraction|"
    r"MODULE_MIGRATION_PLAYBOOK|"
    r"MIGRATED_MODULES|"
    r"REUSABLE_FROM_USERS_AND_GROUPS|"
    r"extract(?:ed|ing)?\s+(?:an?\s+)?MD\s+module|"
    r"migrat(?:e|ed|ing)\s+(?:an?\s+)?(?:MD\s+)?module|"
    r"federated\s+remote|"
    r"Phase\s*3.*(?:host|ExternalModule|VITE_)|"
    r"ExternalModule|"
    r"VITE_[A-Z0-9_]+_URL|"
    r"COP-5597|"
    r"md-extension-migration|"
    r"md-module-template"
    r")"
)

SKIP_RE = re.compile(
    r"(?i)("
    r"did not migrate|"
    r"no module migration|"
    r"checklist (?:does )?not apply|"
    r"\bN/?A\b.*(?:migrat|checklist)|"
    r"audit-log styling only|"
    r"styling only"
    r")"
)


def read_transcript(path: str) -> str:
    if not path or not os.path.isfile(path):
        return ""
    try:
        # Prefer the tail — migration intent is usually in recent turns.
        with open(path, encoding="utf-8", errors="ignore") as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            f.seek(max(0, size - 400_000), os.SEEK_SET)
            return f.read()
    except OSError:
        return ""


transcript_path = (
    payload.get("transcript_path")
    or os.environ.get("CURSOR_TRANSCRIPT_PATH")
    or ""
)
transcript = read_transcript(transcript_path)

# If the agent already dismissed the checklist, stay silent.
if transcript and SKIP_RE.search(transcript[-80_000:]):
    print("{}")
    sys.exit(0)

looks_like_migration = bool(transcript and MIGRATION_RE.search(transcript))

# Fallback when transcript is unavailable: only remind if git shows migration-shaped edits.
if not looks_like_migration and not transcript:
    try:
        diff = subprocess.run(
            ["git", "-C", root, "diff", "--name-only", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        ).stdout
        migration_paths = (
            "RemoteComponent.tsx",
            "vite.config.ts",
            "MODULE_MIGRATION_PLAYBOOK.md",
            "MIGRATED_MODULES.md",
            "ExternalModule",
            "module-routes.tsx",
            "federated-module-wiring",
        )
        looks_like_migration = any(p in diff for p in migration_paths)
    except (OSError, subprocess.SubprocessError):
        looks_like_migration = False

if not looks_like_migration:
    print("{}")
    sys.exit(0)

extra = ""
if md_root and os.path.isdir(os.path.join(root, "users-and-groups")):
    envs = glob.glob(os.path.join(md_root, ".env*"))
    found = False
    for path in envs:
        try:
            with open(path, encoding="utf-8", errors="ignore") as f:
                if "VITE_USERS_AND_GROUPS_URL" in f.read():
                    found = True
                    break
        except OSError:
            pass
    if not found:
        extra = (
            "\nNote: VITE_USERS_AND_GROUPS_URL not found in MD env files — "
            "Phase 3 host wiring may still be open."
        )

print(json.dumps({"followup_message": checklist + extra}))
PY
exit 0
