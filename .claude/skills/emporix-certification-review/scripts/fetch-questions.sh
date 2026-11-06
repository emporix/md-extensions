#!/usr/bin/env sh
# Fetch ClassMarker question-bank pages into a JSON snapshot.
# Never prints API secret or full signature material beyond status lines.
#
# Usage:
#   fetch-questions.sh --out <questions.json>
#   fetch-questions.sh --out <questions.json> --page 1 --max-requests 28
#   fetch-questions.sh --out <questions.json> --resume <prior.json>
#
# Env:
#   CLASSMARKER_API_KEY
#   CLASSMARKER_API_SECRET
# Optional file (sourced when vars are unset):
#   ~/.emporix-classmarker.env  (override with CLASSMARKER_ENV_FILE)

set -eu

OUT=""
RESUME=""
PAGE=""
MAX_REQUESTS="28"
BASE_URL="https://api.classmarker.com"

# Load ~/.emporix-classmarker.env when key/secret are not already set.
# Explicit environment values win over the file.
had_key=${CLASSMARKER_API_KEY-}
had_secret=${CLASSMARKER_API_SECRET-}
CM_ENV_FILE="${CLASSMARKER_ENV_FILE:-$HOME/.emporix-classmarker.env}"
if { [ -z "$had_key" ] || [ -z "$had_secret" ]; } && [ -f "$CM_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$CM_ENV_FILE"
  set +a
fi
if [ -n "$had_key" ]; then CLASSMARKER_API_KEY=$had_key; fi
if [ -n "$had_secret" ]; then CLASSMARKER_API_SECRET=$had_secret; fi

while [ $# -gt 0 ]; do
  case "$1" in
    --out)
      OUT="${2:-}"
      shift 2
      ;;
    --resume)
      RESUME="${2:-}"
      shift 2
      ;;
    --page)
      PAGE="${2:-}"
      shift 2
      ;;
    --max-requests)
      MAX_REQUESTS="${2:-}"
      shift 2
      ;;
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: fetch-questions.sh --out <questions.json> [--resume <json>] [--page N] [--max-requests N]" >&2
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

die() {
  echo "$1" >&2
  exit "${2:-1}"
}

[ -n "$OUT" ] || die "Missing --out" 2

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  die "python3 is required" 1
fi

KEY="${CLASSMARKER_API_KEY:-}"
SECRET="${CLASSMARKER_API_SECRET:-}"
[ -n "$KEY" ] || die "Missing CLASSMARKER_API_KEY" 3
[ -n "$SECRET" ] || die "Missing CLASSMARKER_API_SECRET" 3

OUT_DIR=$(dirname "$OUT")
mkdir -p "$OUT_DIR"

export CLASSMARKER_API_KEY="$KEY"
export CLASSMARKER_API_SECRET="$SECRET"
export CM_OUT="$OUT"
export CM_RESUME="${RESUME:-}"
export CM_PAGE="${PAGE:-}"
export CM_MAX_REQUESTS="$MAX_REQUESTS"
export CM_BASE_URL="$BASE_URL"

"$PY" - <<'PY'
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

out_path = os.environ["CM_OUT"]
resume_path = os.environ.get("CM_RESUME") or ""
page_arg = os.environ.get("CM_PAGE") or ""
max_requests = int(os.environ.get("CM_MAX_REQUESTS") or "28")
base_url = (os.environ.get("CM_BASE_URL") or "https://api.classmarker.com").rstrip("/")
api_key = os.environ["CLASSMARKER_API_KEY"]
api_secret = os.environ["CLASSMARKER_API_SECRET"]


def die(msg, code):
    print(msg, file=sys.stderr)
    sys.exit(code)


def sign(ts: int) -> str:
    raw = f"{api_key}{api_secret}{ts}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def request_json(path: str, params: dict) -> dict:
    ts = int(time.time())
    q = {
        "api_key": api_key,
        "timestamp": str(ts),
        "signature": sign(ts),
        **{k: str(v) for k, v in params.items()},
    }
    url = f"{base_url}{path}?{urllib.parse.urlencode(q)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            die(f"HTTP {e.code} from ClassMarker (non-JSON body)", 4)
        err = data.get("error") or {}
        if err.get("error_code") == "rateLimitExceeded" or data.get("status") == "error":
            if err.get("error_code") == "rateLimitExceeded":
                raise RateLimited(err.get("next_request_after"), data)
        die(f"ClassMarker API error: {err.get('error_message') or body[:200]}", 4)
    except urllib.error.URLError as e:
        die(f"Network error calling ClassMarker: {e.reason}", 4)


class RateLimited(Exception):
    def __init__(self, next_after, payload):
        self.next_after = next_after
        self.payload = payload


def load_resume(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data.get("questions"), list):
        die("Resume file missing questions list", 2)
    return data


snapshot = {
    "source": "classmarker_api",
    "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "pages_fetched": [],
    "complete": False,
    "questions": [],
}

seen_ids = set()

if resume_path:
    if not os.path.isfile(resume_path):
        die(f"Resume file not found: {resume_path}", 2)
    snapshot = load_resume(resume_path)
    snapshot["source"] = "classmarker_api"
    snapshot["fetched_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for q in snapshot.get("questions") or []:
        qid = q.get("question_id")
        if qid is not None:
            seen_ids.add(qid)
    if not snapshot.get("pages_fetched"):
        snapshot["pages_fetched"] = []

if page_arg:
    page = int(page_arg)
elif snapshot.get("pages_fetched"):
    page = max(snapshot["pages_fetched"]) + 1
else:
    page = 1

requests_used = 0
rate_limited = False
next_after = None

try:
    while requests_used < max_requests:
        data = request_json("/v1/questions.json", {"page": page})
        requests_used += 1
        status = data.get("status")
        if status and status != "ok":
            err = data.get("error") or {}
            if err.get("error_code") == "rateLimitExceeded":
                raise RateLimited(err.get("next_request_after"), data)
            code = err.get("error_code") or "unknown"
            msg = err.get("error_message") or status
            die(f"ClassMarker API error ({code}): {msg}", 4)

        batch = data.get("questions")
        if batch is None and isinstance(data.get("data"), dict):
            batch = data["data"].get("questions")
        if batch is None:
            batch = []

        for q in batch:
            qid = q.get("question_id")
            if qid in seen_ids:
                continue
            seen_ids.add(qid)
            snapshot["questions"].append(q)

        if page not in snapshot["pages_fetched"]:
            snapshot["pages_fetched"].append(page)

        # Full page of 200 ⇒ more may follow; short page ⇒ done.
        if len(batch) < 200:
            snapshot["complete"] = True
            break
        page += 1
    else:
        # Hit max_requests without completing
        snapshot["complete"] = False
except RateLimited as e:
    rate_limited = True
    next_after = e.next_after
    snapshot["complete"] = False

os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(snapshot, f, indent=2, ensure_ascii=False)
    f.write("\n")

n = len(snapshot["questions"])
pages = snapshot["pages_fetched"]
print(
    f"Wrote {n} questions to {out_path} "
    f"(pages={pages}, complete={snapshot['complete']}, requests={requests_used})",
    file=sys.stderr,
)

if rate_limited:
    print(
        f"Rate limited after {requests_used} request(s). "
        f"next_request_after={next_after}. Resume with --resume {out_path} --page {page}",
        file=sys.stderr,
    )
    sys.exit(5)

if not snapshot["complete"]:
    print(
        f"Partial snapshot (request budget {max_requests}). "
        f"Resume with --resume {out_path} --page {page}",
        file=sys.stderr,
    )

sys.exit(0)
PY
