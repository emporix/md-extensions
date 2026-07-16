#!/usr/bin/env bash
# afterFileEdit — flag common MD→extension port anti-patterns in edited files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK_INPUT="$(cat)"
export HOOK_INPUT
export MD_EXTENSIONS_ROOT="$ROOT"

python3 <<'PY'
import json, os, re, sys

root = os.environ["MD_EXTENSIONS_ROOT"]
raw = os.environ.get("HOOK_INPUT", "")
try:
    data = json.loads(raw) if raw.strip() else {}
except json.JSONDecodeError:
    data = {}

file_path = data.get("file_path") or data.get("path") or data.get("file") or ""
if not file_path:
    print("{}")
    sys.exit(0)

candidates = [file_path]
if not os.path.isabs(file_path):
    candidates.append(os.path.join(root, file_path))

target = next((p for p in candidates if os.path.isfile(p)), None)
if not target:
    print("{}")
    sys.exit(0)

norm = target.replace("\\", "/")
rel = ""
try:
    if os.path.commonpath([target, root]) == root:
        rel = os.path.relpath(target, root).replace("\\", "/")
except ValueError:
    rel = ""

in_extensions_tree = "/md-extensions/" in norm or bool(rel and not rel.startswith(".."))
interesting = (
    "/src/" in norm
    or norm.endswith("/vite.config.ts")
    or norm.endswith("/package.json")
    or norm.endswith("/RemoteComponent.tsx")
)
if not (in_extensions_tree and interesting):
    print("{}")
    sys.exit(0)

try:
    text = open(target, encoding="utf-8", errors="ignore").read()
except OSError:
    print("{}")
    sys.exit(0)

issues = []
if re.search(r"from ['\"]primereact|from ['\"]primeicons", text):
    issues.append("Direct primereact/primeicons import — use @emporix/component-library instead.")
if re.search(r"MdDataTable|ProductDataProvider", text):
    issues.append("MD-only dependency (MdDataTable/ProductDataProvider) — rewrite to CL / lean shared components.")
if "VITE_API_BASE_URL" in text:
    issues.append("Use VITE_API_URL, not VITE_API_BASE_URL.")
if "AppState" in os.path.basename(target) and re.search(r"permissions\s*[?:]", text):
    issues.append("Do not put permissions on AppState — use PermissionsProvider.")
if re.search(r"jest\.(mock|requireActual)", text):
    issues.append("Use Vitest vi.mock / importOriginal, not Jest.")
if re.search(r"file:.*component-library", text):
    issues.append("Pin published @emporix/component-library semver — never commit file: links.")
base = os.path.basename(target)
if "/administration/" in text and (
    base in ("paths.ts", "RemoteComponent.tsx") or "navigate" in base.lower()
):
    issues.append("Prefer Hash-relative paths (constants/paths.ts), not host /administration/ URLs.")

if not issues:
    print("{}")
else:
    msg = "MD extension port check:\n- " + "\n- ".join(issues)
    print(json.dumps({"additional_context": msg}))
PY
exit 0
