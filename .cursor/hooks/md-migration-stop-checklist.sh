#!/usr/bin/env bash
# stop — remind the agent of MD→extension migration hard gates (fail-open).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MD_ROOT="$(cd "$ROOT/../management-dashboard" 2>/dev/null && pwd || true)"

python3 - "$ROOT" "$MD_ROOT" <<'PY'
import json, os, sys, glob

root, md_root = sys.argv[1], sys.argv[2] or ""

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
        extra = "\nNote: VITE_USERS_AND_GROUPS_URL not found in MD env files — Phase 3 host wiring may still be open."

print(json.dumps({"followup_message": checklist + extra}))
PY
exit 0
