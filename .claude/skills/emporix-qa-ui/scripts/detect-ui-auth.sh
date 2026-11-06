#!/usr/bin/env sh
# Classify the current repo for emporix-qa-ui boot.
# Never prints tokens. Does not start the app.
#
# Prints:
#   AUTH=md-token|cockpit-token|none
#   GATE=1|0
#   START=...
#   BASE_URL_HINT=...
#   REASON=...
#
# Management Dashboard is not a cockpit template. Default local-dev
# (`yarn serve` / `npm run serve`) uses Ory and has no Tenant/Token form.
# QA must use `serve:local-qa` so the same gate as cockpits is shown.

set -eu

ROOT="${1:-.}"
cd "$ROOT"

python3 - <<'PY'
import json
import subprocess
import sys
from pathlib import Path

root = Path(".").resolve()


def load_json(path: Path):
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def git_remote() -> str:
    try:
        return subprocess.check_output(
            ["git", "remote", "get-url", "origin"],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return ""


cfg = load_json(root / "ai-setup.json")
app = cfg.get("app") if isinstance(cfg.get("app"), dict) else {}
pkg = load_json(root / "package.json")
scripts = pkg.get("scripts") if isinstance(pkg.get("scripts"), dict) else {}
pkg_name = str(pkg.get("name") or "")
configured_auth = str(app.get("auth") or "").strip()
configured_start = str(app.get("start") or "").strip()
configured_base = str(app.get("baseUrl") or "").strip()
remote = git_remote()
identity = " ".join([root.name, remote, pkg_name]).lower()

is_md = (
    "management-dashboard" in identity
    or (pkg_name == "md" and "serve:local-qa" in scripts)
    or ((root / ".env.local-qa").is_file() and "serve:local-qa" in scripts)
)
is_cockpit = (not is_md) and (
    "cockpit" in identity or "cockpit" in configured_start.lower()
)

if is_md:
    auth = "md-token"
    reason = "management-dashboard (not a cockpit template)"
elif configured_auth in ("md-token", "cockpit-token"):
    auth = configured_auth
    reason = "app.auth"
elif is_cockpit:
    auth = "cockpit-token"
    reason = "cockpit repo or start path"
elif configured_auth == "none":
    auth = "none"
    reason = "app.auth"
else:
    auth = "none"
    reason = "no tenant-token gate"

yarn_lock = (root / "yarn.lock").is_file()
npm_lock = (root / "package-lock.json").is_file()
if yarn_lock and not npm_lock:
    runner = "yarn"
elif npm_lock and not yarn_lock:
    runner = "npm run"
elif yarn_lock:
    runner = "yarn"
else:
    runner = "npm run"


start = configured_start
base = configured_base
if auth == "md-token":
    if configured_start and "local-qa" in configured_start:
        start = configured_start
    elif "serve:local-qa" in scripts:
        start = (
            f"{runner} serve:local-qa"
            if runner == "yarn"
            else "npm run serve:local-qa"
        )
        if configured_start:
            reason = reason + "; override start to serve:local-qa"
    else:
        print(
            "AUTH=md-token but package.json has no serve:local-qa. "
            "Do not start yarn/npm serve (Ory). Add the script or use a "
            "branch that has it.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not base:
        base = "http://localhost:4200"

print(f"AUTH={auth}")
print(f"GATE={'1' if auth in ('md-token', 'cockpit-token') else '0'}")
print(f"START={start}")
print(f"BASE_URL_HINT={base}")
print(f"REASON={reason}")
PY
