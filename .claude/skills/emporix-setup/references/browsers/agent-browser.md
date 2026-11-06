# Browser provider: agent-browser

`load-config.sh` resolves this file as `$BROWSER_FILE` when `ai-setup.json`
has `app.kind` `ui` or `fullstack` and `browser.provider` `agent-browser`
(a repo-local override at `.ai/overrides/browsers/agent-browser.md` wins).
`emporix-qa-ui` names operations; this file says how to run them.

This is the **default** UI QA browser: headless `agent-browser` CLI. Do not
use the Cursor IDE browser, Playwright, Puppeteer, `open`, the operator's
Chrome profile, or a cloud browser. Do not treat `doctor` as a launch.
Launch is **open**.

## Host access (do this on the first attempt)

`agent-browser install`, `doctor`, `open`, and Chrome-for-Testing **cannot**
run in Cursor's default sandbox. That sandbox blocks the Chrome download and
the browser process. The failure
`BROWSER_INSTALLED=0` / `live browser launch failed after autonomous install`
almost always means the command was sandboxed — not that the tool is missing.

On **every** `agent-browser` shell call (ensure-installed, doctor, open,
snapshot, interact, screenshot, close):

- Cursor Shell: set `required_permissions` to `["all"]` on the **first**
  call. Do not try the sandbox first and retry.
- Claude Code / Codex: full host / `danger-full-access` (same idea).

Do not narrate a sandbox failure and then retry a different installer.

**Install once.** On later QA runs, **reuse** the cached CLI. Do not run
`agent-browser install` or the long ensure-installed script when the binary
already exists. Do not say “installing” on a warm run.

If a snapshot does not make the next click obvious, screenshot and ask the
executor (`emporix-qa-ui` `references/ask-executor.md`). Do not guess. Do
not switch tools to “see” the page.

`emporix-qa-ui` resolves the CLI with `"$(skill_script emporix-qa-ui qa-browser.sh)" ensure`
(writes `.ai/qa/browser-local.json`). Do not paste the ensure-installed
block on a warm run.

Then, one session (`qa-<runId>`), every command with `--session` and `--json`:

1. **open** `$BASE_URL`
2. **snapshot** `-i`
3. **interact** / **assert** / **screenshot** using only refs from the latest snapshot
4. **close**

If a step fails, print the JSON, **close**, and stop. Do not switch tools.

Local, self-provisioning CLI plus Chrome for Testing. No Node, project package
manager, preinstalled browser, or cloud-browser account.

## Pinned release

Installs are pinned to `agent-browser` **v0.38.2**; every downloaded binary is
verified against the SHA-256 sums recorded in the install scripts below before
it is executed. A binary that fails verification is deleted and the operation
aborts. To bump the pin, update the version and the per-asset sums together —
the sums are the asset `digest` fields the GitHub releases API reports at
`/repos/vercel-labs/agent-browser/releases/tags/<tag>`.

## Prerequisites

- Network access to GitHub Releases and the Chrome-for-Testing download host on
  first install. Warm runs reuse the cached binary and browser.
- Supported release targets: macOS x64/arm64; Linux glibc or musl x64/arm64;
  Windows x64. WSL2 uses the matching Linux target. Windows on ARM may use the
  x64 binary only when the operating system's x64 compatibility layer is active.
- Linux Chrome libraries may require root. The operation below performs the
  install itself when already root or passwordless elevation is available; it
  never delegates commands to the operator.

## Operations

### reuse

Locate a pinned CLI that was already installed. Do **not** download, do **not**
run `install`, do **not** run `doctor`. Full host access (`required_permissions: ["all"]`).

POSIX:

```bash
AGENT_BROWSER_VERSION=v0.38.2
CACHE_ROOT=${XDG_CACHE_HOME:-"$HOME/.cache"}
if command -v agent-browser >/dev/null 2>&1; then
  AGENT_BROWSER_BIN=$(command -v agent-browser)
else
  OS=$(uname -s 2>/dev/null || echo unknown)
  ARCH=$(uname -m 2>/dev/null || echo unknown)
  case "$ARCH" in x86_64|amd64) ARCH=x64 ;; arm64|aarch64) ARCH=arm64 ;; *) ARCH=unsupported ;; esac
  case "$OS" in
    Darwin) ASSET="agent-browser-darwin-$ARCH" ;;
    Linux)
      LIBC=linux
      (ldd --version 2>&1 || true) | grep -qi musl && LIBC=linux-musl
      ASSET="agent-browser-$LIBC-$ARCH"
      ;;
    MINGW*|MSYS*|CYGWIN*) ASSET=agent-browser-win32-x64.exe ;;
    *) ASSET=unsupported ;;
  esac
  AGENT_BROWSER_BIN="$CACHE_ROOT/agent-tools/agent-browser/$AGENT_BROWSER_VERSION/$ASSET"
fi
if [ -x "$AGENT_BROWSER_BIN" ]; then
  printf 'BROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=1\nBROWSER_COMMAND=%s\nBROWSER_VERSION=%s\nBROWSER_NOTES=reused cache\n' \
    "$AGENT_BROWSER_BIN" "$("$AGENT_BROWSER_BIN" --version 2>/dev/null || echo unknown)"
else
  printf 'BROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=0\nBROWSER_COMMAND=%s\nBROWSER_VERSION=unknown\nBROWSER_NOTES=need ensure-installed\n' \
    "${AGENT_BROWSER_BIN:-}"
  exit 1
fi
```

If this prints `BROWSER_INSTALLED=1`, go to **open**. Do not run ensure-installed.

### ensure-installed

First machine only (or after **reuse** failed). Use an existing healthy
`agent-browser` from `PATH`; otherwise install the pinned official release in
a per-user cache, verifying the SHA-256 sum of the downloaded binary before it
is ever executed. Do not add binary files to the repository. After a successful
`doctor`, write `.chrome-ready` next to the binary so later runs **reuse**.

POSIX shell (macOS, Linux, WSL2, Git Bash/MSYS):

```bash
if command -v agent-browser >/dev/null 2>&1; then
  AGENT_BROWSER_BIN=$(command -v agent-browser)
else
  AGENT_BROWSER_VERSION=v0.38.2
  CACHE_ROOT=${XDG_CACHE_HOME:-"$HOME/.cache"}
  TOOL_DIR="$CACHE_ROOT/agent-tools/agent-browser/$AGENT_BROWSER_VERSION"
  mkdir -p "$TOOL_DIR"
  OS=$(uname -s 2>/dev/null || echo unknown)
  ARCH=$(uname -m 2>/dev/null || echo unknown)
  case "$ARCH" in x86_64|amd64) ARCH=x64 ;; arm64|aarch64) ARCH=arm64 ;; *) ARCH=unsupported ;; esac
  case "$OS" in
    Darwin) ASSET="agent-browser-darwin-$ARCH" ;;
    Linux)
      LIBC=linux
      (ldd --version 2>&1 || true) | grep -qi musl && LIBC=linux-musl
      ASSET="agent-browser-$LIBC-$ARCH"
      ;;
    MINGW*|MSYS*|CYGWIN*) ASSET=agent-browser-win32-x64.exe ;;
    *) ASSET=unsupported ;;
  esac
  case "$ASSET" in *unsupported*) echo "Unsupported agent-browser target: $OS/$ARCH" >&2; exit 1 ;; esac
  case "$ASSET" in
    agent-browser-darwin-arm64) ASSET_SHA256=8168b86ab5d94be8f670992dfe4fe1445016518a864b48bda105e64142e7cbf9 ;;
    agent-browser-darwin-x64) ASSET_SHA256=787cb40e086a188d0bb13ff29a99a0b2380aff3aa5e8600b8f8131a0b98ca69c ;;
    agent-browser-linux-arm64) ASSET_SHA256=690c02d952de8497bba4f8cc58b59acbf27dc27b346755869b518f4b411c7f40 ;;
    agent-browser-linux-musl-arm64) ASSET_SHA256=eafeca9ca0fdb2fa2aa60c4554723348c739656b0ddba0d82ff654d4d33311b1 ;;
    agent-browser-linux-musl-x64) ASSET_SHA256=993d462f4dcfc19860d93a6521a452eba4502bfc449fe0120303c2ccb998e675 ;;
    agent-browser-linux-x64) ASSET_SHA256=a54b765192db774666f0513fa8b545a298753b6f29e73bcdf4a1e78f18e7c0e1 ;;
    agent-browser-win32-x64.exe) ASSET_SHA256=a6a9a3654c41ee19c05961b73489db98cff9eae88a77436986df08a7a7a73786 ;;
  esac
  AGENT_BROWSER_BIN="$TOOL_DIR/$ASSET"
  if [ ! -x "$AGENT_BROWSER_BIN" ]; then
    URL="https://github.com/vercel-labs/agent-browser/releases/download/$AGENT_BROWSER_VERSION/$ASSET"
    TMP="$AGENT_BROWSER_BIN.tmp.$$"
    if command -v curl >/dev/null 2>&1; then curl -fL --retry 3 --connect-timeout 30 --max-time 600 -o "$TMP" "$URL"
    elif command -v wget >/dev/null 2>&1; then wget -T 30 -t 3 -O "$TMP" "$URL"
    else echo "No built-in HTTP downloader is available" >&2; exit 1
    fi
    if command -v sha256sum >/dev/null 2>&1; then GOT_SHA256=$(sha256sum "$TMP" | awk '{print $1}')
    else GOT_SHA256=$(shasum -a 256 "$TMP" | awk '{print $1}')
    fi
    if [ "$GOT_SHA256" != "$ASSET_SHA256" ]; then
      rm -f "$TMP"
      echo "agent-browser $AGENT_BROWSER_VERSION $ASSET checksum mismatch: expected $ASSET_SHA256, got $GOT_SHA256" >&2
      exit 1
    fi
    chmod 755 "$TMP"
    mv "$TMP" "$AGENT_BROWSER_BIN"
  fi
fi

if ! "$AGENT_BROWSER_BIN" doctor --json >/dev/null 2>&1; then
  "$AGENT_BROWSER_BIN" install
  if ! "$AGENT_BROWSER_BIN" doctor --json >/dev/null 2>&1; then
    if [ "$(uname -s 2>/dev/null || true)" = Linux ]; then
      if [ "$(id -u)" = 0 ]; then
        "$AGENT_BROWSER_BIN" install --with-deps
      elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
        sudo -n "$AGENT_BROWSER_BIN" install --with-deps
      fi
    fi
  fi
fi
if "$AGENT_BROWSER_BIN" doctor --json >/dev/null; then
  touch "$(dirname "$AGENT_BROWSER_BIN")/.chrome-ready"
  printf 'BROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=1\nBROWSER_COMMAND=%s\nBROWSER_VERSION=%s\nBROWSER_NOTES=\n' \
    "$AGENT_BROWSER_BIN" "$("$AGENT_BROWSER_BIN" --version 2>/dev/null || echo unknown)"
else
  printf 'BROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=0\nBROWSER_COMMAND=%s\nBROWSER_VERSION=unknown\nBROWSER_NOTES=live browser launch failed — re-run this script unsandboxed (Cursor Shell required_permissions=["all"]); do not switch browser tools\n' "$AGENT_BROWSER_BIN"
  exit 1
fi
```

Native Windows PowerShell:

```powershell
$onPath = Get-Command agent-browser -ErrorAction SilentlyContinue
if ($onPath) { $AgentBrowser = $onPath.Source }
else {
  $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
  if ($arch -notin 'X64','Arm64') { throw "Unsupported agent-browser Windows architecture: $arch" }
  $pinnedVersion = 'v0.38.2'
  $expectedSha256 = 'a6a9a3654c41ee19c05961b73489db98cff9eae88a77436986df08a7a7a73786'
  $toolDir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) "agent-tools/agent-browser/$pinnedVersion"
  New-Item -ItemType Directory -Force -Path $toolDir | Out-Null
  $AgentBrowser = Join-Path $toolDir 'agent-browser-win32-x64.exe'
  if (-not (Test-Path $AgentBrowser)) {
    $url = "https://github.com/vercel-labs/agent-browser/releases/download/$pinnedVersion/agent-browser-win32-x64.exe"
    $tmp = "$AgentBrowser.tmp.$PID"
    if ($PSVersionTable.PSVersion.Major -lt 7) {
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    }
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 600 -Uri $url -OutFile $tmp
    $gotSha256 = (Get-FileHash -Algorithm SHA256 -Path $tmp).Hash.ToLowerInvariant()
    if ($gotSha256 -ne $expectedSha256) {
      Remove-Item -Force $tmp
      throw "agent-browser $pinnedVersion checksum mismatch: expected $expectedSha256, got $gotSha256"
    }
    Move-Item -Force $tmp $AgentBrowser
  }
}
& $AgentBrowser doctor --json | Out-Null
if ($LASTEXITCODE -ne 0) {
  & $AgentBrowser install
  & $AgentBrowser doctor --json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'agent-browser live browser launch failed — re-run unsandboxed (full host access); do not switch browser tools' }
}
New-Item -ItemType File -Force -Path (Join-Path (Split-Path $AgentBrowser) '.chrome-ready') | Out-Null
$version = (& $AgentBrowser --version 2>$null)
"BROWSER_PROVIDER=agent-browser"
"BROWSER_INSTALLED=1"
"BROWSER_COMMAND=$AgentBrowser"
"BROWSER_VERSION=$version"
"BROWSER_NOTES="
```

### doctor

```bash
"$AGENT_BROWSER_BIN" doctor --json
```

PowerShell: `& $AgentBrowser doctor --json`.

### open

Use a unique, validated session id such as `qa-<runId>`:

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" open "$BASE_URL" --json
```

### snapshot

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" snapshot -i --json
```

### interact

Use only a ref returned by the latest snapshot:

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" click "$ELEMENT_REF" --json
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" fill "$ELEMENT_REF" "$VALUE" --json
```

Other actions use the matching CLI command shown by
`"$AGENT_BROWSER_BIN" --help`; never interpolate untrusted shell fragments.

### assert

Use JSON output and compare the observed value in the current shell. Examples:

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" get text "$ELEMENT_REF" --json
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" get url --json
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" is visible "$ELEMENT_REF" --json
```

### screenshot

```bash
SCREENSHOT_DIR=$(dirname "$SCREENSHOT_PATH")
mkdir -p "$SCREENSHOT_DIR"
ABS_SCREENSHOT_PATH=$(cd "$SCREENSHOT_DIR" && pwd)/$(basename "$SCREENSHOT_PATH")
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" screenshot "$ABS_SCREENSHOT_PATH" --json
test -s "$ABS_SCREENSHOT_PATH"
```

The absolute path avoids the CLI treating a relative multi-segment path as a
selector. PowerShell resolves it with
`[IO.Path]::GetFullPath($ScreenshotPath)`, creates the parent directory, then
checks `Test-Path` and a non-zero file length.

### close

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" close --json 2>/dev/null || true
```

In PowerShell, run the same arguments with `& $AgentBrowser` in `finally` and
ignore only an already-closed-session error.

## Rules

- Use a unique session per QA/test run. Never attach to a user's normal browser
  profile.
- Keep all operation targets local to the application under test. Do not enable
  a cloud provider or send credentials to a remote browser service.
- Do not run `skills get`, chat, or provider setup. Those are not part of QA.
- On cockpits, do not **open** until tenant and token are already collected
  (`emporix-qa-ui` `references/cockpit-auth.md`).
- If the next action is unclear, screenshot and ask the executor. Do not
  switch to the Cursor IDE browser.
- Never run this CLI in a restricted sandbox. Cursor: `required_permissions: ["all"]` on the first call.
