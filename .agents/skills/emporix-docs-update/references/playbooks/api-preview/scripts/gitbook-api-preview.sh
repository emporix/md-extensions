#!/usr/bin/env bash
# Upload an OpenAPI file to GitBook and attach a parent + computed API page
# in an API Sandbox change request via the REST API (not MCP tool JSON).
#
# Avoids agent/MCP limits: large YAML never passes through CallDynamicTool;
# nested insert_computed_page payloads are built in this script.
#
# Auth (first match wins):
#   1. GITBOOK_TOKEN or GITBOOK_API_TOKEN env
#   2. Authorization Bearer from ~/.cursor/mcp.json → mcpServers.gitbook-mcp.headers
#
# Usage (local file → source.text):
#   ./gitbook-api-preview.sh \
#     --yml /path/to/api.yml \
#     --slug sandbox-media-api-test-abc123 \
#     --service media \
#     --ref api-test \
#     --preview-id 'emporix/api-references|media|api-test'
#
# Usage (public raw URL → source.url; preferred for pushed api-references branches):
#   ./gitbook-api-preview.sh \
#     --url 'https://raw.githubusercontent.com/emporix/api-references/api-test/path/api.yml' \
#     --slug sandbox-product-api-test-abc123 \
#     --service product \
#     --ref api-test \
#     --preview-id 'emporix/api-references|product|api-test'
#
# Or finish pages only (spec already uploaded):
#   ./gitbook-api-preview.sh --pages-only --slug ... --service ... --ref ... \
#     --change-request 7 --preview-id '...'
set -euo pipefail

# Pinned API Sandbox destination (do not override via env — prevents redirect).
ORG_ID="z8MNPigQv25NZe33g3AV"
SPACE_ID="tUdmqvwo2mTd4qEbqojs"
API_BASE="${GITBOOK_API_BASE:-https://api.gitbook.com/v1}"

YML=""
SOURCE_URL=""
SLUG=""
SERVICE=""
REF=""
PREVIEW_ID=""
CR=""
TITLE=""
MERGE=0
PAGES_ONLY=0
SKIP_UPSERT=0
MERGED=0

die() { echo "error: $*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yml) YML="${2:-}"; shift 2 ;;
    --url) SOURCE_URL="${2:-}"; shift 2 ;;
    --slug) SLUG="${2:-}"; shift 2 ;;
    --service) SERVICE="${2:-}"; shift 2 ;;
    --ref) REF="${2:-}"; shift 2 ;;
    --preview-id) PREVIEW_ID="${2:-}"; shift 2 ;;
    --change-request|--cr) CR="${2:-}"; shift 2 ;;
    --title) TITLE="${2:-}"; shift 2 ;;
    --merge) MERGE=1; shift ;;
    --pages-only) PAGES_ONLY=1; SKIP_UPSERT=1; shift ;;
    --skip-upsert) SKIP_UPSERT=1; shift ;;
    -h|--help)
      sed -n '2,35p' "$0"
      exit 0
      ;;
    *) die "unknown arg: $1" ;;
  esac
done

[[ -n "$SLUG" ]] || die "--slug is required"
[[ -n "$SERVICE" ]] || die "--service is required"
[[ -n "$REF" ]] || die "--ref is required"
# Full documented format: hyphen segments only, sandbox prefix, max 100 chars
# (blocks path traversal like sandbox-test/../order in the REST URL).
if [[ ${#SLUG} -gt 100 ]]; then
  die "--slug exceeds 100 characters (${#SLUG})"
fi
if [[ ! "$SLUG" =~ ^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$ ]]; then
  die "--slug must match ^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$ (got: ${SLUG})"
fi
[[ "$SLUG" == sandbox-* ]] || die "--slug must start with sandbox-"
if [[ "$PAGES_ONLY" -eq 1 && -z "$CR" ]]; then
  die "--pages-only requires --change-request {id|number}"
fi
if [[ "$PAGES_ONLY" -eq 0 && "$SKIP_UPSERT" -eq 0 ]]; then
  if [[ -n "$YML" && -n "$SOURCE_URL" ]]; then
    die "pass only one of --yml or --url"
  fi
  if [[ -n "$SOURCE_URL" ]]; then
    [[ "$SOURCE_URL" =~ ^https?:// ]] || die "--url must be an http(s) URL"
  elif [[ -n "$YML" ]]; then
    [[ -f "$YML" ]] || die "--yml path must exist: ${YML}"
  else
    die "either --yml <path> or --url <raw-url> is required (unless --pages-only)"
  fi
fi
[[ -n "$PREVIEW_ID" ]] || PREVIEW_ID="unknown|${SERVICE}|${REF}"
[[ -n "$TITLE" ]] || TITLE="Sandbox: ${SERVICE} (${REF})"
# GitBook change-request subject max length is 100
if [[ ${#TITLE} -gt 100 ]]; then
  echo "warning: truncating change-request title from ${#TITLE} to 100 characters" >&2
  TITLE="${TITLE:0:97}..."
fi
SOURCE_LABEL="${SOURCE_URL:-${YML:-(already uploaded)}}"

resolve_token() {
  if [[ -n "${GITBOOK_TOKEN:-}" ]]; then
    printf '%s' "$GITBOOK_TOKEN"
    return
  fi
  if [[ -n "${GITBOOK_API_TOKEN:-}" ]]; then
    printf '%s' "$GITBOOK_API_TOKEN"
    return
  fi
  local mcp="${HOME}/.cursor/mcp.json"
  if [[ -f "$mcp" ]] && command -v jq >/dev/null 2>&1; then
    local raw
    raw=$(jq -r '
      .mcpServers["gitbook-mcp"].headers.Authorization
      // .mcpServers.gitbook.headers.Authorization
      // empty
    ' "$mcp" 2>/dev/null || true)
    if [[ -n "$raw" && "$raw" != "null" ]]; then
      printf '%s' "${raw#Bearer }"
      return
    fi
  fi
  die "no GitBook token: set GITBOOK_TOKEN or add Bearer header on gitbook-mcp in ~/.cursor/mcp.json"
}

TOKEN=$(resolve_token)
AUTH="Authorization: Bearer ${TOKEN}"

api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -f -X "$method" \
    -H "$AUTH" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    "${API_BASE}${path}" \
    "$@"
}

# GET into a named variable (no command-substitution subshell — die() aborts the script).
# Sets $1 to the response body.
# Exit 0 on 2xx; exit 1 on 404 when allow_404=1; die on any other failure.
api_get_into() {
  local __outvar="$1"
  local path="$2"
  local allow_404="${3:-0}"
  local tmp http
  tmp=$(mktemp)
  http=$(curl -sS -o "$tmp" -w '%{http_code}' -X GET \
    -H "$AUTH" \
    -H "Accept: application/json" \
    "${API_BASE}${path}" || echo "000")
  if [[ "$http" == "000" ]]; then
    rm -f "$tmp"
    die "GitBook API GET ${path} failed (network/curl error)"
  fi
  if [[ "$http" =~ ^2[0-9][0-9]$ ]]; then
    # shellcheck disable=SC2034
    printf -v "$__outvar" '%s' "$(cat "$tmp")"
    rm -f "$tmp"
    return 0
  fi
  rm -f "$tmp"
  if [[ "$allow_404" -eq 1 && "$http" == "404" ]]; then
    printf -v "$__outvar" '%s' ""
    return 1
  fi
  die "GitBook API GET ${path} failed with HTTP ${http}"
}

# Required read for resume / child decisions — never treat failure as empty.
fetch_cr_pages_into() {
  local __outvar="$1"
  api_get_into "$__outvar" "/spaces/${SPACE_ID}/change-requests/${CR_ID}/content/pages" 0
}

# Poll until OpenAPI slug is complete with a version (and no PARSE_ERROR).
wait_spec_ready() {
  local max_attempts="${1:-45}"
  local i STATE VER ERR ERR_CODE
  for i in $(seq 1 "$max_attempts"); do
    SPEC=$(api GET "/orgs/${ORG_ID}/openapi/${SLUG}")
    STATE=$(printf '%s' "$SPEC" | jq -r '.processingState // empty')
    VER=$(printf '%s' "$SPEC" | jq -r '.lastVersion // empty')
    ERR=$(printf '%s' "$SPEC" | jq -r '.lastProcessedErrorCount // 0')
    ERR_CODE=$(printf '%s' "$SPEC" | jq -r '.lastProcessErrorCode // empty')
    # lastVersion can lag briefly after processingState=complete
    if [[ "$STATE" == "complete" ]]; then
      if [[ -n "$ERR_CODE" && "$ERR_CODE" != "null" && "$ERR_CODE" != "" ]]; then
        die "OpenAPI processing failed with ${ERR_CODE} (errors=${ERR}). Fix the YAML and retry."
      fi
      if [[ -z "$VER" || "$VER" == "null" ]]; then
        VER=$(api GET "/orgs/${ORG_ID}/openapi/${SLUG}/versions/latest" | jq -r '.id // empty' || true)
      fi
      if [[ -n "$VER" && "$VER" != "null" ]]; then
        if [[ "$ERR" != "0" ]]; then
          echo "warning: processing complete with lastProcessedErrorCount=${ERR}" >&2
        fi
        echo "spec ready version=${VER}"
        return 0
      fi
    fi
    if [[ "$i" -eq "$max_attempts" ]]; then
      die "spec still not complete after wait (state=${STATE} lastVersion=${VER})"
    fi
    sleep 2
  done
}

# Exit 0 if page body mentions the current OpenAPI slug; 1 if confirmed absent
# (404 or 2xx without slug). Non-404 errors → die in this shell (not a subshell).
page_belongs_to_slug() {
  local page_id="$1"
  local page_json=""
  if api_get_into page_json "/spaces/${SPACE_ID}/change-requests/${CR_ID}/content/page/${page_id}" 1; then
    :
  elif api_get_into page_json "/spaces/${SPACE_ID}/content/page/${page_id}" 1; then
    :
  else
    return 1
  fi
  printf '%s' "$page_json" | grep -Fq -- "$SLUG"
}

# Resume: set $1 to a parent id titled like this run whose body references the
# current slug. Must not run under $() — die() must abort the main script.
# Exit 0 if found; 1 if no slug-matching parent (after successful reads).
find_resume_parent_into() {
  local __outvar="$1"
  local pages_json="${2:-}"
  local title="$3"
  local ids id
  [[ -n "$pages_json" ]] || die "find_resume_parent_into: pages JSON required (refusing empty as no-match)"
  printf -v "$__outvar" '%s' ""
  # Newest/last candidates first (CR-local inserts tend to trail the base tree).
  ids=$(printf '%s' "$pages_json" | jq -r --arg t "$title" '
    [.. | objects | select(.title? == $t and (.id? != null))]
    | reverse
    | .[].id
  ')
  for id in $ids; do
    if page_belongs_to_slug "$id"; then
      printf -v "$__outvar" '%s' "$id"
      return 0
    fi
  done
  return 1
}

# Exit 0 if page JSON has computed OpenAPI metadata bound to the exact current slug.
# Prose that merely mentions "OpenAPI" + the slug must not match.
page_is_openapi_for_slug() {
  local page_id="$1"
  local page_json=""
  if api_get_into page_json "/spaces/${SPACE_ID}/change-requests/${CR_ID}/content/page/${page_id}" 1; then
    :
  elif api_get_into page_json "/spaces/${SPACE_ID}/content/page/${page_id}" 1; then
    :
  else
    return 1
  fi
  printf '%s' "$page_json" | jq -e --arg slug "$SLUG" '
    def binds_slug:
      (.spec? == $slug)
      or (.ref.spec? == $slug)
      or (.dependencies.spec.ref.spec? == $slug)
      or (.computed.dependencies.spec.ref.spec? == $slug)
      or ((.ref.kind? == "openapi") and (.ref.spec? == $slug))
      or ((.dependencies.spec.ref.kind? == "openapi") and (.dependencies.spec.ref.spec? == $slug))
      or ((.computed.dependencies.spec.ref.kind? == "openapi")
          and (.computed.dependencies.spec.ref.spec? == $slug));
    def is_computed_openapi:
      (.type? == "builtin:openapi")
      or (.computed.type? == "builtin:openapi")
      or (.kind? == "openapi");
    [.. | objects | select(is_computed_openapi and binds_slug)] | length > 0
  ' >/dev/null 2>&1
}

# Direct child ids under parent (title match first when $3 is set).
list_parent_child_ids() {
  local pages_json="$1"
  local parent_id="$2"
  local prefer_title="${3:-}"
  printf '%s' "$pages_json" | jq -r --arg p "$parent_id" --arg t "$prefer_title" '
    def kids:
      (.pages // .children // .nodes // [])
      | if type=="array" then . else [] end;
    ([.. | objects | select(.id? == $p)] | .[0]) as $parent
    | (
        ($parent | kids)
        + [.. | objects | select((.parent // .parentId // "") == $p)]
      )
    | map(select(.id? != null))
    | unique_by(.id)
    | if $t != "" then
        (map(select(.title == $t)) + map(select(.title != $t)))
      else . end
    | .[].id
  '
}

# True when parent already has OpenAPI content for the current slug (not merely
# any child such as a manually added Notes page).
parent_has_openapi_for_slug() {
  local pages_json="${1:-}"
  local parent_id="${2:-$PARENT_ID}"
  local id
  [[ -n "$pages_json" ]] || die "parent_has_openapi_for_slug: pages JSON required"
  [[ -n "$parent_id" ]] || die "parent_has_openapi_for_slug: parent id required"
  while IFS= read -r id; do
    [[ -n "$id" ]] || continue
    if page_is_openapi_for_slug "$id"; then
      return 0
    fi
  done < <(list_parent_child_ids "$pages_json" "$parent_id" "$CHILD_TITLE")
  return 1
}

echo "org=${ORG_ID} space=${SPACE_ID} slug=${SLUG}"

# --- verify space title ---
SPACE_JSON=$(api GET "/spaces/${SPACE_ID}")
SPACE_TITLE=$(printf '%s' "$SPACE_JSON" | jq -r '.title // empty')
[[ "$SPACE_TITLE" == "API Sandbox" ]] || die "space title is '${SPACE_TITLE}', expected API Sandbox"

# --- upsert OpenAPI (source.url for public raw URLs, source.text for local files) ---
if [[ "$SKIP_UPSERT" -eq 0 ]]; then
  BODY_FILE=$(mktemp)
  # shellcheck disable=SC2064
  trap "rm -f '$BODY_FILE'" EXIT
  if [[ -n "$SOURCE_URL" ]]; then
    echo "upserting OpenAPI from URL ${SOURCE_URL} ..."
    jq -n --arg url "$SOURCE_URL" '{source: {url: $url}}' > "$BODY_FILE"
  else
    echo "upserting OpenAPI from ${YML} ..."
    # jq -Rs is portable; --rawfile is missing/empty on some jq builds
    jq -Rs '{source: {text: .}}' < "$YML" > "$BODY_FILE"
    BYTE_LEN=$(wc -c < "$YML" | tr -d " ")
    BODY_TEXT_LEN=$(jq -r '.source.text | length' "$BODY_FILE")
    if [[ "$BODY_TEXT_LEN" -lt 10 ]]; then
      die "refusing upload: OpenAPI text payload is empty/too short (${BODY_TEXT_LEN} chars); check jq and file ${YML}"
    fi
    echo "payload chars=${BODY_TEXT_LEN} file_bytes=${BYTE_LEN}"
  fi
  # @file keeps large source.text bodies off argv (Linux ARG_MAX)
  UPSERT=$(api PUT "/orgs/${ORG_ID}/openapi/${SLUG}" --data-binary @"$BODY_FILE")
  rm -f "$BODY_FILE"
  trap - EXIT
  STATE=$(printf '%s' "$UPSERT" | jq -r '.processingState // "unknown"')
  echo "upsert ok processingState=${STATE}"
  wait_spec_ready 45
else
  echo "skipping upsert (--pages-only / --skip-upsert)"
  # Still require a ready version before pages or merge (resume / --merge safety)
  echo "verifying existing OpenAPI slug is ready ..."
  wait_spec_ready 45
fi

# --- create or reuse change request ---
# Only reuse parent/child pages when finishing an existing CR. A brand-new CR's
# pages list includes published Sandbox content, so title match would wrongly
# skip inserts after a prior merge of the same service title.
CR_PROVIDED=0
[[ -n "$CR" ]] && CR_PROVIDED=1

if [[ "$CR_PROVIDED" -eq 0 ]]; then
  DESC=$(printf '%s\n\n%s\n%s\n%s' \
    "Sandbox preview — draft by default; merge only if explicitly requested." \
    "slug: ${SLUG}" \
    "preview-id: ${PREVIEW_ID}" \
    "Branch: ${REF}")
  CR_BODY=$(jq -n \
    --arg subject "$TITLE" \
    --arg desc "$DESC" \
    '{subject: $subject, description: {object:"document", data:{}, nodes:[{object:"block", type:"paragraph", nodes:[{object:"text", leaves:[{object:"leaf", text:$desc, marks:[]}]}]}]}}')
  CR_JSON=$(api POST "/spaces/${SPACE_ID}/change-requests" --data-binary "$CR_BODY")
  CR=$(printf '%s' "$CR_JSON" | jq -r '.id // .number // empty')
  [[ -n "$CR" ]] || die "failed to create change request"
  echo "created change request ${CR}"
else
  echo "using change request ${CR}"
fi

CR_JSON=$(api GET "/spaces/${SPACE_ID}/change-requests/${CR}")
CR_ID=$(printf '%s' "$CR_JSON" | jq -r '.id')
CR_NUM=$(printf '%s' "$CR_JSON" | jq -r '.number')
CR_URL=$(printf '%s' "$CR_JSON" | jq -r '.urls.app // empty')
REV=$(printf '%s' "$CR_JSON" | jq -r '.revision // empty')

SERVICE_TITLE=$(printf '%s' "$SERVICE" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
PARENT_TITLE="${SERVICE_TITLE} API (${REF})"
CHILD_TITLE="API reference"
# Markdown tables treat | as column separators even inside backticks — escape
# for display only; PREVIEW_ID / SOURCE_LABEL stay unchanged for cleanup/matching.
PREVIEW_ID_MD="${PREVIEW_ID//|/\\|}"
SOURCE_LABEL_MD="${SOURCE_LABEL//|/\\|}"
PARENT_MD=$(cat <<EOF
# ${PARENT_TITLE}

This change request previews the **${SERVICE_TITLE}** OpenAPI specification.

| | |
|---|---|
| Service | \`${SERVICE}\` |
| Branch / ref | \`${REF}\` |
| OpenAPI slug | \`${SLUG}\` |
| Preview id | \`${PREVIEW_ID_MD}\` |
| Source | \`${SOURCE_LABEL_MD}\` |

The **API reference** child pages under this parent are generated from the
sandbox OpenAPI spec (operations and models). They belong only to this service.
EOF
)

PARENT_ID=""
CHILD_ID=""
PAGES_JSON=""

if [[ "$CR_PROVIDED" -eq 1 ]]; then
  # Resume: reuse only a parent that documents this run's OpenAPI slug
  # (title alone can match an inherited/merged page for the same service/ref).
  fetch_cr_pages_into PAGES_JSON
  if find_resume_parent_into PARENT_ID "$PAGES_JSON" "$PARENT_TITLE"; then
    echo "reusing existing parent overview page ${PARENT_ID} (slug=${SLUG})"
  else
    PARENT_ID=""
    echo "no slug-matching parent for ${PARENT_TITLE}; will insert a fresh one"
  fi
fi

if [[ -z "$PARENT_ID" || "$PARENT_ID" == "null" ]]; then
  PARENT_BODY=$(jq -n \
    --arg title "$PARENT_TITLE" \
    --arg md "$PARENT_MD" \
    --arg rev "$REV" \
    '{
      expectedRevision: $rev,
      changes: [
        {
          operation: "insert_page",
          title: $title,
          ref: "sandbox-parent",
          document: { markdown: $md }
        }
      ]
    }')

  echo "inserting parent overview page ..."
  PARENT_RESP=$(api POST "/spaces/${SPACE_ID}/change-requests/${CR_ID}/content?compat=false" \
    --data-binary "$PARENT_BODY")
  # Insert response shape: { changes: [{ ref: "sandbox-parent", page: { id } }] }
  PARENT_ID=$(printf '%s' "$PARENT_RESP" | jq -r '
    [.changes[]? | select(.ref == "sandbox-parent") | .page.id // .page.page.id // empty]
    | map(select(length > 0))
    | .[0] // empty
  ')
  if [[ -z "$PARENT_ID" || "$PARENT_ID" == "null" ]]; then
    PARENT_ID=$(printf '%s' "$PARENT_RESP" | jq -r '
      [.. | objects | select(.ref? == "sandbox-parent")]
      | .[0].page.id // .[0].id // empty
    ')
  fi
  [[ -n "$PARENT_ID" && "$PARENT_ID" != "null" ]] || die "could not resolve parent page id after insert_page"
fi

# Refresh pages + revision before child insert
CR_JSON=$(api GET "/spaces/${SPACE_ID}/change-requests/${CR_ID}")
REV=$(printf '%s' "$CR_JSON" | jq -r '.revision // empty')
fetch_cr_pages_into PAGES_JSON

SKIP_CHILD_INSERT=0
if [[ "$CR_PROVIDED" -eq 1 ]]; then
  # Reuse only when a child is OpenAPI content for this slug — not merely any
  # child (e.g. a Notes page) or a same-titled page for another spec.
  if parent_has_openapi_for_slug "$PAGES_JSON" "$PARENT_ID"; then
    echo "reusing existing computed OpenAPI under parent ${PARENT_ID} (slug=${SLUG})"
    SKIP_CHILD_INSERT=1
  fi
fi

if [[ "$SKIP_CHILD_INSERT" -eq 0 ]]; then
  COMPUTED_BODY=$(jq -n \
    --arg title "$CHILD_TITLE" \
    --arg into "$PARENT_ID" \
    --arg slug "$SLUG" \
    --arg rev "$REV" \
    '{
      expectedRevision: $rev,
      changes: [
        {
          operation: "insert_computed_page",
          title: $title,
          into: $into,
          computed: {
            type: "builtin:openapi",
            props: { models: true },
            dependencies: {
              spec: { ref: { kind: "openapi", spec: $slug } }
            }
          }
        }
      ]
    }')

  echo "inserting computed OpenAPI under parent ${PARENT_ID} ..."
  if ! api POST "/spaces/${SPACE_ID}/change-requests/${CR_ID}/content?compat=false" \
    --data-binary "$COMPUTED_BODY" >/dev/null; then
    fetch_cr_pages_into PAGES_JSON
    if parent_has_openapi_for_slug "$PAGES_JSON" "$PARENT_ID"; then
      echo "computed OpenAPI already present under parent ${PARENT_ID} (after insert conflict, slug=${SLUG})"
    else
      die "failed to insert computed OpenAPI under parent ${PARENT_ID}"
    fi
  fi
fi

if [[ "$MERGE" -eq 1 ]]; then
  echo "merging change request into API Sandbox ..."
  if api POST "/spaces/${SPACE_ID}/change-requests/${CR_ID}/merge" --data-binary '{}' >/dev/null; then
    MERGED=1
  elif api POST "/spaces/${SPACE_ID}/change-requests/${CR_ID}/merge" >/dev/null; then
    MERGED=1
  else
    die "merge failed for change request ${CR_NUM} (${CR_ID}); left as draft"
  fi
fi

CR_JSON=$(api GET "/spaces/${SPACE_ID}/change-requests/${CR_ID}")
CR_URL=$(printf '%s' "$CR_JSON" | jq -r '.urls.app // empty')
STATUS=$(printf '%s' "$CR_JSON" | jq -r '.status // empty')

cat <<EOF

# API preview result (script)

## GitBook
- Space: API Sandbox (${SPACE_ID})
- OpenAPI slug: ${SLUG}
- Preview id: ${PREVIEW_ID}
- Change request: ${CR_NUM} (${CR_ID}) status=${STATUS}
- Parent page: ${PARENT_ID}
- Source: ${SOURCE_LABEL}
- Preview URL: ${CR_URL}

## Notes
- Uploaded via GitBook REST (not MCP tool arguments)
- Parent overview page + nested builtin:openapi API reference
- Merged: $([[ "$MERGED" -eq 1 ]] && echo yes || echo no)
EOF
