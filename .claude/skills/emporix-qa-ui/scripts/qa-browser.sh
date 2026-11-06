#!/usr/bin/env sh
# Resolve the pinned agent-browser CLI once per machine.
# Warm runs: reuse .ai/qa/browser-local.json or the cache — never download.
# Cold runs (`ensure`): download + doctor, then write browser-local.json.
#
# Must run unsandboxed (Cursor Shell required_permissions=["all"]).
# Invoke from the product repository root.

set -eu

AGENT_BROWSER_VERSION=v0.38.2
QA_DIR="${QA_DIR:-.ai/qa}"
LOCAL_FILE="${QA_DIR}/browser-local.json"
MODE="${1:-ensure}"

die() {
  echo "$1" >&2
  exit 1
}

cache_root() {
  if [ -n "${XDG_CACHE_HOME:-}" ]; then
    echo "$XDG_CACHE_HOME"
  else
    echo "$HOME/.cache"
  fi
}

asset_name() {
  OS=$(uname -s 2>/dev/null || echo unknown)
  ARCH=$(uname -m 2>/dev/null || echo unknown)
  case "$ARCH" in x86_64|amd64) ARCH=x64 ;; arm64|aarch64) ARCH=arm64 ;; *) ARCH=unsupported ;; esac
  case "$OS" in
    Darwin) echo "agent-browser-darwin-$ARCH" ;;
    Linux)
      LIBC=linux
      (ldd --version 2>&1 || true) | grep -qi musl && LIBC=linux-musl
      echo "agent-browser-$LIBC-$ARCH"
      ;;
    MINGW*|MSYS*|CYGWIN*) echo "agent-browser-win32-x64.exe" ;;
    *) echo "unsupported" ;;
  esac
}

asset_sha256() {
  case "$1" in
    agent-browser-darwin-arm64) echo 8168b86ab5d94be8f670992dfe4fe1445016518a864b48bda105e64142e7cbf9 ;;
    agent-browser-darwin-x64) echo 787cb40e086a188d0bb13ff29a99a0b2380aff3aa5e8600b8f8131a0b98ca69c ;;
    agent-browser-linux-arm64) echo 690c02d952de8497bba4f8cc58b59acbf27dc27b346755869b518f4b411c7f40 ;;
    agent-browser-linux-musl-arm64) echo eafeca9ca0fdb2fa2aa60c4554723348c739656b0ddba0d82ff654d4d33311b1 ;;
    agent-browser-linux-musl-x64) echo 993d462f4dcfc19860d93a6521a452eba4502bfc449fe0120303c2ccb998e675 ;;
    agent-browser-linux-x64) echo a54b765192db774666f0513fa8b545a298753b6f29e73bcdf4a1e78f18e7c0e1 ;;
    agent-browser-win32-x64.exe) echo a6a9a3654c41ee19c05961b73489db98cff9eae88a77436986df08a7a7a73786 ;;
    *) echo "" ;;
  esac
}

is_pinned() {
  VER=$("$1" --version 2>/dev/null || true)
  GOT=$(printf '%s\n' "$VER" | sed -n 's/.*\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/p' | head -n 1)
  [ "$GOT" = "${AGENT_BROWSER_VERSION#v}" ]
}

cached_bin() {
  ASSET=$(asset_name)
  [ "$ASSET" != "unsupported" ] || die "Unsupported agent-browser target"
  echo "$(cache_root)/agent-tools/agent-browser/$AGENT_BROWSER_VERSION/$ASSET"
}

emit_ok() {
  BIN="$1"
  NOTES="${2:-reused}"
  VER=$("$BIN" --version 2>/dev/null || echo unknown)
  printf 'BROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=1\nBROWSER_COMMAND=%s\nBROWSER_VERSION=%s\nBROWSER_NOTES=%s\n' \
    "$BIN" "$VER" "$NOTES"
}

write_local() {
  BIN="$1"
  mkdir -p "$QA_DIR"
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg cmd "$BIN" --arg at "$NOW" \
      '{version:1,provider:"agent-browser",command:$cmd,verifiedAt:$at}' >"$LOCAL_FILE"
  else
    printf '{"version":1,"provider":"agent-browser","command":"%s","verifiedAt":"%s"}\n' "$BIN" "$NOW" >"$LOCAL_FILE"
  fi
}

read_local_cmd() {
  [ -f "$LOCAL_FILE" ] || return 1
  if command -v jq >/dev/null 2>&1; then
    jq -r '.command // empty' "$LOCAL_FILE" 2>/dev/null
  else
    sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$LOCAL_FILE" | head -n 1
  fi
}

download_cli() {
  BIN="$1"
  ASSET=$(basename "$BIN")
  EXPECTED=$(asset_sha256 "$ASSET")
  [ -n "$EXPECTED" ] || die "No checksum for $ASSET"
  URL="https://github.com/vercel-labs/agent-browser/releases/download/$AGENT_BROWSER_VERSION/$ASSET"
  mkdir -p "$(dirname "$BIN")"
  TMP="$BIN.tmp.$$"
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 --connect-timeout 30 --max-time 600 -o "$TMP" "$URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -T 30 -t 3 -O "$TMP" "$URL"
  else
    die "No curl or wget"
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    GOT=$(sha256sum "$TMP" | awk '{print $1}')
  else
    GOT=$(shasum -a 256 "$TMP" | awk '{print $1}')
  fi
  if [ "$GOT" != "$EXPECTED" ]; then
    rm -f "$TMP"
    die "agent-browser checksum mismatch: expected $EXPECTED, got $GOT"
  fi
  chmod 755 "$TMP"
  mv "$TMP" "$BIN"
}

install_engine() {
  BIN="$1"
  "$BIN" install
  if ! "$BIN" doctor --json >/dev/null 2>&1; then
    if [ "$(uname -s 2>/dev/null || true)" = Linux ]; then
      if [ "$(id -u)" = 0 ]; then
        "$BIN" install --with-deps
      elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
        sudo -n "$BIN" install --with-deps
      fi
    fi
  fi
  "$BIN" doctor --json >/dev/null || die "agent-browser doctor failed — run this script unsandboxed (Cursor required_permissions=[\"all\"])"
}

try_reuse() {
  CMD=$(read_local_cmd || true)
  if [ -n "${CMD:-}" ] && [ -x "$CMD" ] && is_pinned "$CMD"; then
    emit_ok "$CMD" "reused browser-local.json"
    return 0
  fi
  BIN=$(cached_bin)
  if [ -x "$BIN" ] && is_pinned "$BIN"; then
    write_local "$BIN"
    emit_ok "$BIN" "reused cache"
    return 0
  fi
  PATH_BIN=$(command -v agent-browser 2>/dev/null || true)
  if [ -n "${PATH_BIN:-}" ] && [ -x "$PATH_BIN" ] && is_pinned "$PATH_BIN"; then
    write_local "$PATH_BIN"
    emit_ok "$PATH_BIN" "reused PATH"
    return 0
  fi
  return 1
}

ensure() {
  if try_reuse; then
    return 0
  fi
  BIN=$(cached_bin)
  if [ ! -x "$BIN" ]; then
    download_cli "$BIN"
  fi
  install_engine "$BIN"
  write_local "$BIN"
  emit_ok "$BIN" "installed"
}

forget() {
  rm -f "$LOCAL_FILE"
  echo "Removed $LOCAL_FILE"
}

case "$MODE" in
  resolve|reuse)
    try_reuse || die "BROWSER_INSTALLED=0 — run: sh $0 ensure"
    ;;
  ensure)
    ensure
    ;;
  forget)
    forget
    ;;
  *)
    die "Usage: $0 {resolve|ensure|forget}"
    ;;
esac
