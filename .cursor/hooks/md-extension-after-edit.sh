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

# Normalise to absolute. Editors may hand us a repo-relative path, and the
# commonpath() check below raises ValueError when mixing relative with
# absolute — which previously made the hook silently no-op.
target = os.path.abspath(target)

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
    or norm.endswith("/tsconfig.app.json")
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

# --- Added after COP-6180 (brands): visual / parity drift ---

if norm.endswith((".scss", ".css")) and re.search(r"--grey-|--blue-|var\(--red\)", text):
    issues.append(
        "MD global CSS variable in remote styles — map to component-library tokens "
        "(or a local SCSS variable when CL has no equivalent)."
    )

if base in ("SectionBox.tsx", "SectionBox.module.scss", "SectionBox.scss"):
    issues.append(
        "Local SectionBox copy — component-library >= 2.3.0 exports SectionBox/SectionTitle; import it instead."
    )

if re.search(r"from ['\"].*hooks/useForm['\"]", text) or base == "useForm.ts":
    issues.append(
        "MD useForm is coupled to NavigationConfirmProvider — use react-hook-form, as customer-groups/brands do. "
        "Do not port or reconstruct it."
    )

if base == "RemoteComponent.tsx":
    if "export { RemoteComponent }" not in text:
        issues.append(
            "RemoteComponent must be exported named AND default — a default-only expose unwraps to a bare "
            "function and the host's loadRemoteModule (module.default) gets undefined."
        )
    missing = [
        p for p in (
            "ToastProvider", "DashboardProvider", "PermissionsProvider", "FeatureTogglesProvider",
            "ConfigurationProvider", "SitesProvider", "UIBlockerProvider",
        )
        if p not in text
    ]
    if missing:
        issues.append(
            "Provider stack is missing: " + ", ".join(missing)
            + ". Copy all seven unless the module provably needs none of a provider's data (skill Phase 2b)."
        )

if re.search(r"window\.location\.(assign|href)", text):
    issues.append(
        "Navigating to a host-owned route: no in-remote route exists for it. Confirm the choice with the user "
        "and comment why (see AssetsViewer in brands)."
    )

if base == "package.json":
    m = re.search(r'"quill"\s*:\s*"[^0-9]*(\d+)', text)
    if m and m.group(1) != "1":
        issues.append(
            "quill must be 1.x with PrimeReact 8's Editor — Quill 2 changed clipboard.convert() and the "
            "editor silently loads no existing content."
        )
    if re.search(r'"(chart\.js|quill)"\s*:', text) and "/brands/" not in norm:
        issues.append("Template leftovers (chart.js / quill) — drop unless this module actually needs them.")

if base == "tsconfig.app.json" and '"exclude"' not in text:
    issues.append(
        'tsconfig.app.json needs "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"] — '
        "otherwise copied helper tests break typecheck."
    )

if not issues:
    print("{}")
else:
    msg = "MD extension port check:\n- " + "\n- ".join(issues)
    print(json.dumps({"additional_context": msg}))
PY
exit 0
