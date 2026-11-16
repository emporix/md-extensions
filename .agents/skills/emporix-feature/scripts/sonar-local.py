#!/usr/bin/env python3
"""Local SonarQube for the emporix-feature sonar-scan stage.

Runs a pinned SonarQube Community Build in Docker on this machine, loads the
Emporix Java quality profile into it, analyses a Java (Maven or Gradle)
checkout, and splits the findings into new code (lines this branch changed
against its base) and the rest. No paid server, no token from anyone else.

    sonar-local.py scan        --root DIR --base BRANCH --out DIR   # all of it
    sonar-local.py server      [--root DIR]                         # only start / bootstrap the server
    sonar-local.py findings    --root DIR --base BRANCH --out DIR [--from-file JSON]
    sonar-local.py mark        --key KEY --as falsepositive|accept|safe|acknowledged --comment TEXT [--hotspot]
    sonar-local.py fingerprint --root DIR
    sonar-local.py detect      --root DIR
    sonar-local.py stop | reset

Results go to stdout as KEY=VALUE lines (STATUS=ok|skip|fail and REASON= on
every command); progress goes to stderr. Exit 0 on ok and skip, 1 on fail.

State (admin password, analysis token, port) lives in
${EMPORIX_SONAR_HOME:-~/.emporix/sonar}/<container>.json, mode 600. The token
is never printed. Overrides: EMPORIX_SONAR_IMAGE (server image),
EMPORIX_SONAR_PORT (preferred host port, default 9000), EMPORIX_SETTINGS_FILE
(sonar.enabled=false turns the stage off).
"""

import argparse
import base64
import datetime as dt
import hashlib
import json
import os
import re
import secrets
import shutil
import socket
import string
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets", "sonar")
LABEL = "com.emporix.sonar"
SEVERITY_ORDER = ["INFO", "LOW", "MEDIUM", "HIGH", "BLOCKER"]
LEGACY_SEVERITY = {"BLOCKER": "BLOCKER", "CRITICAL": "HIGH", "MAJOR": "MEDIUM", "MINOR": "LOW", "INFO": "INFO"}


class Fail(Exception):
    def __init__(self, reason, message, status="fail"):
        super().__init__(message)
        self.reason = reason
        self.status = status


def log(msg):
    print(f"sonar-local: {msg}", file=sys.stderr, flush=True)


def emit(**values):
    for k, v in values.items():
        if v is None:
            v = ""
        if isinstance(v, (list, tuple)):
            v = ",".join(str(x) for x in v)
        print(f"{k}={v}")
    sys.stdout.flush()


def run(cmd, cwd=None, env=None, check=True, capture=True):
    res = subprocess.run(cmd, cwd=cwd, env=env, text=True,
                         stdout=subprocess.PIPE if capture else None,
                         stderr=subprocess.PIPE if capture else None)
    if check and res.returncode != 0:
        raise Fail("command-failed", f"{' '.join(cmd)} failed: {(res.stderr or res.stdout or '').strip()[-800:]}")
    return res


def load_versions():
    with open(os.path.join(ASSETS, "versions.json"), encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

def sonar_enabled():
    if os.environ.get("EMPORIX_SONAR", "").lower() in ("off", "false", "0"):
        return False
    path = os.environ.get("EMPORIX_SETTINGS_FILE") or os.path.expanduser("~/.emporix/settings.json")
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return True
    except ValueError:
        raise Fail("settings-invalid", f"{path} is not valid JSON")
    value = (data.get("sonar") or {}).get("enabled", True) if isinstance(data.get("sonar"), dict) else True
    return str(value).lower() not in ("false", "0", "off")


def state_home():
    home = os.environ.get("EMPORIX_SONAR_HOME") or os.path.expanduser("~/.emporix/sonar")
    os.makedirs(home, mode=0o700, exist_ok=True)
    os.chmod(home, 0o700)   # makedirs leaves an existing directory's mode alone
    return home


def read_state(name):
    path = os.path.join(state_home(), f"{name}.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return {}


def write_state(name, state):
    path = os.path.join(state_home(), f"{name}.json")
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    # The mode argument only applies to a new file; a stale tmp file keeps its
    # own mode, so set it explicitly before the password and token go in.
    os.fchmod(fd, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, path)
    os.chmod(path, 0o600)


# ---------------------------------------------------------------------------
# Project detection
# ---------------------------------------------------------------------------

BUILD_FILES = ("build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts")


def detect_build(root):
    if os.path.isfile(os.path.join(root, "pom.xml")):
        return "maven"
    if any(os.path.isfile(os.path.join(root, f)) for f in BUILD_FILES):
        return "gradle"
    return "none"


def _read(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def _java_major(text):
    text = text.strip().strip("'\"")
    m = re.match(r"^1\.(\d+)$", text)
    if m:
        return int(m.group(1))
    m = re.match(r"^(?:VERSION_)?(\d+)", text)
    return int(m.group(1)) if m else None


def detect_java(root, build):
    """Java language level the project compiles for; None when not declared."""
    found = []
    if build == "maven":
        pom = _read(os.path.join(root, "pom.xml"))
        for tag in ("maven.compiler.release", "release", "java.version", "maven.compiler.source", "maven.compiler.target", "source"):
            for m in re.finditer(rf"<{re.escape(tag)}>\s*([^<$]+?)\s*</{re.escape(tag)}>", pom):
                v = _java_major(m.group(1))
                if v:
                    found.append(v)
    elif build == "gradle":
        for name in ("build.gradle", "build.gradle.kts"):
            text = _read(os.path.join(root, name))
            for pat in (r"languageVersion(?:\.set\()?\s*=?\s*JavaLanguageVersion\.of\(\s*(\d+)",
                        r"(?:source|target)Compatibility\s*=?\s*(?:JavaVersion\.toVersion\()?\s*['\"]?([\w.]+)",
                        r"JavaVersion\.(VERSION_[\d_]+)",
                        r"jvmToolchain\(\s*(\d+)"):
                for m in re.finditer(pat, text):
                    v = _java_major(m.group(1).replace("VERSION_1_", "1.").replace("VERSION_", ""))
                    if v:
                        found.append(v)
    return max(found) if found else None


def pick_server(java, versions):
    override = os.environ.get("EMPORIX_SONAR_IMAGE")
    if override:
        return override
    for entry in versions["servers"]:
        if java is None or java <= entry["maxJava"]:
            return entry["image"]
    raise Fail("java-unsupported", f"Java {java} is newer than every pinned SonarQube image in versions.json")


def gradle_properties(root):
    """key → value from the project's gradle.properties (comments and blank lines skipped)."""
    props = {}
    for line in _read(os.path.join(root, "gradle.properties")).splitlines():
        line = line.strip()
        if not line or line[0] in "#!":
            continue
        m = re.match(r"([^=:\s]+)\s*[=:\s]\s*(.*)$", line)
        if m:
            props[m.group(1)] = m.group(2).strip()
    return props


def resolve_gradle_version(version, root):
    """A plugin version with `${name}` / `$name` filled in from gradle.properties; None when unresolvable."""
    if not version or "$" not in version:
        return version or None
    props = gradle_properties(root)
    resolved = re.sub(r"\$\{\s*([\w.]+)\s*\}|\$([A-Za-z_]\w*)",
                      lambda m: props.get(m.group(1) or m.group(2), m.group(0)), version)
    return None if "$" in resolved else resolved


def plugin_major(version):
    """Leading major number of a plugin version, or None when it is missing or not numeric."""
    m = re.match(r"^(\d+)(?:\.|$)", (version or "").strip())
    return int(m.group(1)) if m else None


def gradle_plugin(root):
    """(applied, version) of the org.sonarqube Gradle plugin in the root build files.

    A version pinned through a property (`version "${sonarqubePluginVersion}"`) is resolved from
    gradle.properties; one that cannot be resolved is reported as None (unknown)."""
    for name in ("build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"):
        text = _read(os.path.join(root, name))
        m = re.search(r"""id\s*\(?\s*["']org\.sonarqube["']\s*\)?\s*(?:version\s*\(?\s*["']([^"']+)["'])?""", text)
        if m:
            return True, resolve_gradle_version(m.group(1), root)
        if re.search(r"apply\s+plugin:\s*['\"]org\.sonarqube['\"]", text) or "sonarqube-gradle-plugin" in text:
            return True, None
    return False, None


def repo_name(root):
    res = run(["git", "-C", root, "remote", "get-url", "origin"], check=False)
    url = (res.stdout or "").strip()
    if url:
        return re.sub(r"\.git$", "", url.rstrip("/").split("/")[-1].split(":")[-1])
    common = run(["git", "-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"], check=False).stdout.strip()
    if common:
        return os.path.basename(os.path.dirname(common)) if common.endswith("/.git") else os.path.basename(common)
    return os.path.basename(os.path.abspath(root))


def project_key(root):
    branch = run(["git", "-C", root, "branch", "--show-current"], check=False).stdout.strip() or "detached"
    raw = f"emporix-local_{repo_name(root)}_{branch}"
    return re.sub(r"[^A-Za-z0-9_.:-]", "-", raw)[:390]


# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------

def docker(*args, check=True):
    return run(["docker", *args], check=check)


def docker_ready():
    if not shutil.which("docker"):
        return False
    return docker("info", "--format", "{{.ServerVersion}}", check=False).returncode == 0


def ensure_docker():
    if docker_ready():
        return
    if not shutil.which("docker"):
        raise Fail("docker-unavailable", "docker CLI not found; install Docker Desktop", status="skip")
    if sys.platform == "darwin":
        log("Docker is not running; starting Docker Desktop")
        run(["open", "-ga", "Docker"], check=False)
    elif shutil.which("systemctl"):
        run(["systemctl", "--user", "start", "docker-desktop"], check=False)
    deadline = time.time() + int(os.environ.get("EMPORIX_DOCKER_WAIT", "180"))
    while time.time() < deadline:
        if docker_ready():
            log("Docker is up")
            return
        time.sleep(3)
    raise Fail("docker-unavailable", "Docker daemon did not come up; start Docker and retry", status="skip")


def container_name(image):
    tag = image.split(":", 1)[1] if ":" in image else "latest"
    return "emporix-sonarqube-" + re.sub(r"[^A-Za-z0-9_.-]", "-", tag)


def container_info(name):
    res = docker("inspect", name, check=False)
    if res.returncode != 0:
        return None
    return json.loads(res.stdout)[0]


def is_sonar_image(image):
    base = image.split("@")[0].rsplit("/", 1)[-1]
    return base == "sonarqube" or base.startswith("sonarqube:")


def stop_other_sonars(keep):
    """Stop every other running SonarQube container: an old pinned version, or a hand-started one."""
    res = docker("ps", "--format", "{{.Names}}\t{{.Image}}\t{{.Label \"" + LABEL + "\"}}", check=False)
    stopped = []
    for line in (res.stdout or "").splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        name, image = parts[0], parts[1]
        ours = len(parts) > 2 and parts[2] == "1"
        if name != keep and (ours or is_sonar_image(image)):
            log(f"stopping SonarQube container {name} ({image}); only {keep} may run (port and version)")
            docker("stop", name, check=False)
            stopped.append(name)
    return stopped


def port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def pick_port(preferred):
    for port in range(preferred, preferred + 100):
        if port_free(port):
            return port
    raise Fail("no-free-port", f"no free port in {preferred}..{preferred + 99}")


def published_port(info):
    ports = ((info.get("NetworkSettings") or {}).get("Ports") or {}).get("9000/tcp") or []
    for p in ports:
        if p.get("HostPort"):
            return int(p["HostPort"])
    bindings = ((info.get("HostConfig") or {}).get("PortBindings") or {}).get("9000/tcp") or []
    for p in bindings:
        if p.get("HostPort"):
            return int(p["HostPort"])
    return None


def start_container(image, name):
    info = container_info(name)
    if info and info["State"].get("Running"):
        return published_port(info)
    if info:
        port = published_port(info)
        if port and port_free(port):
            log(f"starting existing container {name}")
            if docker("start", name, check=False).returncode == 0:
                return port
        log(f"recreating container {name} (port taken); data volume is kept")
        docker("rm", "-f", name, check=False)
    if docker("image", "inspect", image, check=False).returncode != 0:
        log(f"pulling {image} (first run only, ~1 GB)")
        run(["docker", "pull", image], capture=False)
    port = pick_port(int(os.environ.get("EMPORIX_SONAR_PORT", "9000")))
    log(f"starting {image} as {name} on http://localhost:{port}")
    docker("run", "-d", "--name", name,
           "--label", f"{LABEL}=1", "--label", f"{LABEL}.image={image}",
           "-p", f"127.0.0.1:{port}:9000",
           "-v", f"{name}-data:/opt/sonarqube/data",
           "-v", f"{name}-extensions:/opt/sonarqube/extensions",
           "-e", "SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true",
           "-e", "SONAR_TELEMETRY_ENABLE=false",
           image)
    return port


# ---------------------------------------------------------------------------
# SonarQube Web API
# ---------------------------------------------------------------------------

class Api:
    def __init__(self, url, token=None, basic=None):
        self.url = url.rstrip("/")
        self.token = token
        self.basic = basic

    def _headers(self):
        h = {"Accept": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        elif self.basic:
            h["Authorization"] = "Basic " + base64.b64encode(f"{self.basic[0]}:{self.basic[1]}".encode()).decode()
        return h

    def call(self, method, path, params=None, body=None, content_type=None, ok404=False):
        url = f"{self.url}{path}"
        data = None
        headers = self._headers()
        if method == "GET" and params:
            url += "?" + urllib.parse.urlencode(params)
        elif method == "POST":
            if body is not None:
                data = body
                headers["Content-Type"] = content_type
            else:
                data = urllib.parse.urlencode(params or {}).encode()
                headers["Content-Type"] = "application/x-www-form-urlencoded"
        req = urllib.request.Request(url, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8", "replace")
                return resp.status, (json.loads(raw) if raw.strip().startswith(("{", "[")) else raw)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            try:
                payload = json.loads(raw)
            except ValueError:
                payload = raw
            if ok404 or e.code in (401, 403):
                return e.code, payload
            raise Fail("api-error", f"{method} {path} -> {e.code}: {str(payload)[:400]}")

    def get(self, path, **params):
        return self.call("GET", path, params)[1]

    def post(self, path, **params):
        return self.call("POST", path, params)[1]


def wait_up(url, timeout=420):
    api = Api(url)
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        try:
            status, body = api.call("GET", "/api/system/status", ok404=True)
            state = body.get("status") if isinstance(body, dict) else None
            if state != last:
                log(f"server status: {state}")
                last = state
            if state == "UP":
                return
            if state == "DB_MIGRATION_NEEDED":
                api.call("POST", "/api/system/migrate_db")
        except (urllib.error.URLError, ConnectionError, socket.timeout, OSError):
            pass
        time.sleep(3)
    raise Fail("server-timeout", f"SonarQube at {url} did not reach UP in {timeout}s; see `docker logs`")


def new_password():
    alphabet = string.ascii_letters + string.digits
    core = "".join(secrets.choice(alphabet) for _ in range(24))
    return f"Ex{core}9!a"   # policy: 12+ chars, upper, lower, digit, special


def bootstrap(url, name, state):
    """Return an analysis token; change the default admin password on a fresh server."""
    if state.get("token"):
        status, body = Api(url, token=state["token"]).call("GET", "/api/authentication/validate", ok404=True)
        if isinstance(body, dict) and body.get("valid"):
            return state["token"]
    password = None
    for candidate in [state.get("password"), "admin"]:
        if not candidate:
            continue
        status, body = Api(url, basic=("admin", candidate)).call("GET", "/api/authentication/validate", ok404=True)
        if isinstance(body, dict) and body.get("valid"):
            password = candidate
            break
    if password is None:
        raise Fail("auth-unknown",
                   f"cannot log in to {name}: its admin password is not in {state_home()}. "
                   f"Run `sonar-local.py reset` to recreate the local server")
    if password == "admin":
        fresh = new_password()
        Api(url, basic=("admin", "admin")).post("/api/users/change_password",
                                                 login="admin", previousPassword="admin", password=fresh)
        password = fresh
        state["password"] = password
        write_state(name, state)
        log("changed the default admin password (stored in the local state file)")
    body = Api(url, basic=("admin", password)).post("/api/user_tokens/generate",
                                                     name=f"emporix-skills-{int(time.time())}")
    state["token"] = body["token"]
    write_state(name, state)
    return state["token"]


def multipart(field, filename, content):
    boundary = "----emporix" + secrets.token_hex(12)
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: application/xml\r\n\r\n").encode() + content + f"\r\n--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


def profile_keys(xml_bytes):
    text = xml_bytes.decode("utf-8")
    return [f"{r}:{k}" for r, k in re.findall(r"<repositoryKey>([^<]+)</repositoryKey>\s*<key>([^<]+)</key>", text)]


def ensure_profile(api, name, state, versions):
    profile = versions["profile"]["name"]
    path = os.path.join(ASSETS, versions["profile"]["file"])
    with open(path, "rb") as f:
        xml = f.read()
    digest = hashlib.sha256(xml).hexdigest()
    found = api.get("/api/qualityprofiles/search", language="java", qualityProfile=profile).get("profiles", [])
    if not found or state.get("profileHash") != digest:
        log(f"loading quality profile '{profile}' ({len(profile_keys(xml))} rules)")
        body, ctype = multipart("backup", os.path.basename(path), xml)
        api.call("POST", "/api/qualityprofiles/restore", body=body, content_type=ctype)
        found = api.get("/api/qualityprofiles/search", language="java", qualityProfile=profile)["profiles"]
        state["profileHash"] = digest
    qp = found[0]
    if not qp.get("isDefault"):
        api.post("/api/qualityprofiles/set_default", language="java", qualityProfile=profile)
    if state.get("profileHash") == digest and "missingRules" in state and state.get("profileKey") == qp["key"]:
        missing = state["missingRules"]
    else:
        active, page = set(), 1
        while True:
            body = api.get("/api/rules/search", qprofile=qp["key"], activation="true", ps=500, p=page, f="name")
            active.update(r["key"] for r in body.get("rules", []))
            if page * 500 >= body.get("total", 0):
                break
            page += 1
        missing = sorted(set(profile_keys(xml)) - active)
        state.update(profileKey=qp["key"], missingRules=missing)
    write_state(name, state)
    return profile, len(profile_checks(xml)), uncovered(xml, missing)


def profile_checks(xml):
    """Distinct checks: a javabugs rule and its java fallback count once."""
    return sorted({k.split(":", 1)[1] if k.split(":", 1)[0] in ("java", "javabugs") else k for k in profile_keys(xml)})


def uncovered(xml, missing):
    """Missing keys whose check has no other active key (javabugs:S1 is covered by java:S1)."""
    keys = set(profile_keys(xml))
    missing = set(missing)
    out = []
    for k in sorted(missing):
        repo, rule = k.split(":", 1)
        twin = {"javabugs": f"java:{rule}", "java": f"javabugs:{rule}"}.get(repo)
        if twin and twin in keys and twin not in missing:
            continue
        out.append(k)
    return out


def ensure_server(root=None):
    versions = load_versions()
    build = detect_build(root) if root else "none"
    java = detect_java(root, build) if root else None
    image = pick_server(java, versions)
    name = container_name(image)
    ensure_docker()
    stopped = stop_other_sonars(keep=name)
    port = start_container(image, name)
    url = f"http://localhost:{port}"
    wait_up(url)
    state = read_state(name)
    state.update(image=image, port=port, url=url)
    write_state(name, state)
    token = bootstrap(url, name, state)
    api = Api(url, token=token)
    profile, total, missing = ensure_profile(api, name, state, versions)
    version = Api(url).call("GET", "/api/server/version")[1]
    return dict(url=url, image=image, name=name, version=str(version).strip(), token=token, api=api,
                profile=profile, total=total, missing=missing, stopped=stopped, java=java, build=build,
                versions=versions)


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

def java_major_of(java_bin):
    res = run([java_bin, "-version"], check=False)
    m = re.search(r'version "(?:1\.)?(\d+)', (res.stderr or "") + (res.stdout or ""))
    return int(m.group(1)) if m else None


def java_home_candidates():
    """Installed JDK homes to try when JAVA_HOME is older than the scanners need."""
    homes = []
    if os.path.exists("/usr/libexec/java_home"):   # macOS
        res = run(["/usr/libexec/java_home", "-v", "11+"], check=False)
        if res.returncode == 0 and res.stdout.strip():
            homes.append(res.stdout.strip())
    on_path = shutil.which("java")
    if on_path:   # Linux: often /usr/bin/java -> /usr/lib/jvm/<jdk>/bin/java
        homes.append(os.path.dirname(os.path.dirname(os.path.realpath(on_path))))
    for parent in ("/usr/lib/jvm", "/usr/java", "/opt/java", "/Library/Java/JavaVirtualMachines",
                   os.path.expanduser("~/.sdkman/candidates/java"), os.path.expanduser("~/.jdks")):
        if os.path.isdir(parent):
            for name in sorted(os.listdir(parent), reverse=True):
                home = os.path.join(parent, name)
                homes.append(os.path.join(home, "Contents", "Home") if os.path.isdir(os.path.join(home, "Contents", "Home")) else home)
    return homes


def find_java_home(candidates, minimum=11):
    """The installed home closest to `minimum`: the lowest Java major at or above it (first one wins a tie).

    The closest, not the newest, so the build's Gradle or Maven version can still run on it."""
    best, seen = (None, None), set()
    for home in candidates:
        real = os.path.realpath(home)
        if real in seen:
            continue
        seen.add(real)
        java_bin = os.path.join(home, "bin", "java")
        if os.access(java_bin, os.X_OK):
            major = java_major_of(java_bin)
            if major and major >= minimum and (best[1] is None or major < best[1]):
                best = (home, major)
                if major == minimum:
                    break
    return best


def has_toolchain(root, build):
    """True when the build picks its own compiler JDK (Gradle toolchain, maven-toolchains-plugin)."""
    if build == "gradle":
        text = "".join(_read(os.path.join(root, n)) for n in ("build.gradle", "build.gradle.kts"))
        return bool(re.search(r"languageVersion|jvmToolchain", text))
    if build == "maven":
        return "maven-toolchains-plugin" in _read(os.path.join(root, "pom.xml"))
    return False


def build_tool_java(root, build):
    """Lowest Java the project's build tool itself starts on, from its wrapper (8 when unknown).

    Gradle 9 and Maven 4 need Java 17 to run, even when a toolchain compiles the code."""
    if build == "gradle":
        props, pattern = "gradle/wrapper/gradle-wrapper.properties", r"gradle-(\d+)[\w.-]*-(?:bin|all)\.zip"
        floors = {9: 17}
    elif build == "maven":
        props, pattern = ".mvn/wrapper/maven-wrapper.properties", r"apache-maven-(\d+)\."
        floors = {4: 17}
    else:
        return 8
    m = re.search(pattern, _read(os.path.join(root, props)))
    major = int(m.group(1)) if m else None
    return max((java for tool, java in floors.items() if major and major >= tool), default=8)


def required_java(root, build):
    """Lowest JDK the analysis can run on: 11 for the scanners, the build tool's own minimum (Gradle 9 /
    Maven 4 need 17), and the project's Java level when the build compiles with the JDK it runs on
    (no toolchain), or `release 21` fails on a JDK 17."""
    java = detect_java(root, build)
    level = java if java and not has_toolchain(root, build) else 0
    return max(11, build_tool_java(root, build), level)


def scanner_env(token, url, need=11, candidates=None):
    env = dict(os.environ, SONAR_TOKEN=token, SONAR_HOST_URL=url)
    java_home = env.get("JAVA_HOME")
    java_bin = os.path.join(java_home, "bin", "java") if java_home else shutil.which("java")
    major = java_major_of(java_bin) if java_bin else None
    if major is None or major < need:
        # The scanners need Java 11+ (they provision their own JRE for the engine); a build without a
        # toolchain also needs at least the Java level it compiles for.
        home, found = find_java_home(java_home_candidates() if candidates is None else candidates, need)
        if not home:
            why = "the Sonar scanners need Java 11+" if need == 11 else \
                  f"the build needs Java {need}+ (its build tool, or compiling without a toolchain)"
            raise Fail("java-too-old", f"{why}; JAVA_HOME is Java {major} and no JDK {need}+ is installed")
        env["JAVA_HOME"] = home
        env["PATH"] = os.path.join(home, "bin") + os.pathsep + env.get("PATH", "")
        log(f"using JAVA_HOME={home} (Java {found}) for the build: it needs Java {need}+, JAVA_HOME is Java {major}")
    return env


def analysis_command(root, build, key, url, versions):
    props = [f"-Dsonar.projectKey={key}", f"-Dsonar.projectName={key}", f"-Dsonar.host.url={url}",
             "-Dsonar.scm.disabled=true", "-Dsonar.qualitygate.wait=false"]
    if build == "maven":
        mvn = "./mvnw" if os.access(os.path.join(root, "mvnw"), os.X_OK) else "mvn"
        return [mvn, "-B", "-DskipTests", "-Djacoco.skip=true", "test-compile",
                versions["scanners"]["maven"] + ":sonar", *props], None
    gradle = "./gradlew" if os.access(os.path.join(root, "gradlew"), os.X_OK) else "gradle"
    applied, version = gradle_plugin(root)
    init = None
    task = "sonar"
    major = plugin_major(version) if applied else None
    if major is not None and major < 4:
        task = "sonarqube"
    cmd = [gradle, "classes", "testClasses", task, "-x", "test", *props]
    if not applied:
        init = tempfile.NamedTemporaryFile("w", suffix=".gradle", delete=False)
        init.write(
            "initscript {\n"
            "  repositories { gradlePluginPortal() }\n"
            f"  dependencies {{ classpath 'org.sonarsource.scanner.gradle:sonarqube-gradle-plugin:{versions['scanners']['gradle']}' }}\n"
            "}\n"
            "rootProject { apply plugin: org.sonarqube.gradle.SonarQubePlugin }\n")
        init.close()
        cmd += ["--init-script", init.name]
    return cmd, init.name if init else None


def report_task(root, started):
    best = None
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", ".ai", ".gradle", "src")]
        if "report-task.txt" in filenames and os.path.basename(dirpath) == "sonar":
            path = os.path.join(dirpath, "report-task.txt")
            mtime = os.path.getmtime(path)
            if mtime >= started - 1 and (best is None or mtime > best[0]):
                best = (mtime, path)
    if not best:
        raise Fail("no-report", "the scanner wrote no report-task.txt")
    values = dict(line.split("=", 1) for line in _read(best[1]).splitlines() if "=" in line)
    return values.get("ceTaskId")


def wait_ce(api, task_id, timeout=900):
    deadline = time.time() + timeout
    while time.time() < deadline:
        task = api.get("/api/ce/task", id=task_id)["task"]
        if task["status"] == "SUCCESS":
            return
        if task["status"] in ("FAILED", "CANCELED"):
            raise Fail("analysis-failed", f"server-side analysis {task['status']}: {task.get('errorMessage', '')}")
        time.sleep(2)
    raise Fail("analysis-timeout", f"analysis task {task_id} did not finish in {timeout}s")


def run_build(cmd, root, env, log_path, init=None):
    """Run the build + scanner; any failure, including a missing build tool, is Fail(build-failed)."""
    try:
        with open(log_path, "w", encoding="utf-8") as lf:
            res = subprocess.run(cmd, cwd=root, env=env, stdout=lf, stderr=subprocess.STDOUT, text=True)
    except OSError as e:
        raise Fail("build-failed", f"cannot run {cmd[0]}: {e.strerror or e} (no wrapper in the repository and none on PATH?)")
    finally:
        if init and os.path.exists(init):
            os.unlink(init)
    if res.returncode != 0:
        tail = "".join(open(log_path, encoding="utf-8", errors="replace").readlines()[-40:])
        print(tail, file=sys.stderr)
        raise Fail("build-failed", f"{cmd[0]} exited {res.returncode}; log: {log_path}")


def analyse(root, server, out):
    build = server["build"]
    key = project_key(root)
    cmd, init = analysis_command(root, build, key, server["url"], server["versions"])
    env = scanner_env(server["token"], server["url"], required_java(root, build))
    os.makedirs(out, exist_ok=True)
    log_path = os.path.join(out, "sonar-scan.log")
    log(f"analysing ({build}): {' '.join(cmd[:6])} … (log: {log_path})")
    started = time.time()
    run_build(cmd, root, env, log_path, init)
    scanned = time.time()
    wait_ce(server["api"], report_task(root, started))
    return key, {"analysisSeconds": round(scanned - started), "processingSeconds": round(time.time() - scanned)}


# ---------------------------------------------------------------------------
# New code
# ---------------------------------------------------------------------------

def git(root, *args, check=True):
    return run(["git", "-C", root, "-c", "core.quotePath=false", *args], check=check).stdout


def resolve_base(root, base):
    if not base or base == "auto":
        ref = git(root, "symbolic-ref", "--quiet", "refs/remotes/origin/HEAD", check=False).strip()
        base = ref.replace("refs/remotes/origin/", "") if ref else "master"
    for ref in (f"origin/{base}", base):
        if run(["git", "-C", root, "rev-parse", "--verify", "--quiet", ref + "^{commit}"], check=False).returncode == 0:
            mb = git(root, "merge-base", ref, "HEAD").strip()
            return ref, mb
    raise Fail("no-base", f"base branch '{base}' not found (fetch it first)")


def changed_lines(root, merge_base):
    """{path: set(lines) | None}; None = the whole file is new."""
    changed = {}
    path = None
    for line in git(root, "diff", "-U0", "--no-color", "--no-ext-diff", "-M", merge_base).splitlines():
        if line.startswith("+++ "):
            target = line[4:]
            path = None if target == "/dev/null" else target[2:] if target.startswith("b/") else target
            if path is not None:
                changed.setdefault(path, set())
        elif line.startswith("@@") and path is not None:
            m = re.match(r"@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@", line)
            if m:
                start, count = int(m.group(1)), int(m.group(2) or "1")
                changed[path].update(range(start, start + count))
    for p in git(root, "diff", "--name-only", "--diff-filter=A", merge_base).splitlines():
        changed[p] = None
    for p in git(root, "ls-files", "--others", "--exclude-standard").splitlines():
        changed[p] = None
    return {p: v for p, v in changed.items() if v is None or v}


def fingerprint(root):
    """Content of the working tree (tracked and untracked files, .gitignore honoured).

    A git tree hash built in a throwaway index, so it does not depend on
    commits: committing the scanned content keeps the fingerprint, and a Sonar
    Verdict recorded before `pr` commits still matches the pushed head.
    """
    index = git(root, "rev-parse", "--path-format=absolute", "--git-path", "index").strip()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_index = os.path.join(tmp, "index")
        if os.path.exists(index):
            shutil.copyfile(index, tmp_index)   # reuse the stat cache; the real index is never touched
        env = dict(os.environ, GIT_INDEX_FILE=tmp_index)
        run(["git", "-C", root, "add", "-A"], env=env)
        tree = run(["git", "-C", root, "write-tree"], env=env).stdout.strip()
    return tree[:16]


def issue_severity(issue):
    impacts = issue.get("impacts") or []
    levels = [i.get("severity") for i in impacts if i.get("severity") in SEVERITY_ORDER]
    if levels:
        return max(levels, key=SEVERITY_ORDER.index)
    return LEGACY_SEVERITY.get(issue.get("severity", ""), "MEDIUM")


def normalise(item, kind):
    comp = item.get("component", "")
    path = comp.split(":", 1)[1] if ":" in comp else comp
    tr = item.get("textRange") or {}
    start = tr.get("startLine") or item.get("line")
    end = tr.get("endLine") or start
    return {
        "key": item["key"],
        "kind": kind,
        "rule": item.get("rule") or item.get("ruleKey", ""),
        "severity": issue_severity(item) if kind == "issue" else item.get("vulnerabilityProbability", "MEDIUM"),
        "qualities": sorted({i.get("softwareQuality") for i in item.get("impacts") or [] if i.get("softwareQuality")})
        if kind == "issue" else ["SECURITY"],
        "path": path,
        "startLine": start,
        "endLine": end,
        "message": item.get("message", ""),
    }


def is_new(finding, changed):
    if finding["path"] not in changed:
        return False
    lines = changed[finding["path"]]
    if lines is None:
        return True
    if not finding["startLine"]:
        return False
    return any(n in lines for n in range(finding["startLine"], (finding["endLine"] or finding["startLine"]) + 1))


API_CAP = 10000   # Sonar web API: p * ps may not exceed 10,000
PAGE = 500
PATH_BATCH = 50


def _pages(api, path, field, **params):
    """Every item of a search, or Fail when the server holds more than the API can page through."""
    items, page = [], 1
    while True:
        body = api.get(path, ps=PAGE, p=page, **params)
        items += body.get(field, [])
        total = body.get("paging", {}).get("total", body.get("total", 0))
        if total > API_CAP:
            raise Fail("too-many-findings", f"{path} matched {total} items, more than the API's {API_CAP}; "
                       "even the changed files alone are too many to list")
        if page * PAGE >= total:
            return items, total
        page += 1


def _total(api, path, **params):
    body = api.get(path, ps=1, p=1, **params)
    return body.get("paging", {}).get("total", body.get("total", 0))


def fetch_all(api, key, paths=None):
    """Unresolved issues and to-review hotspots of the project.

    Projects past the API's 10,000-item cap are queried only for the changed
    files (`paths`), batched, so a new-code finding is never cut off; the
    project total still comes from the server's count.
    """
    issue_total = _total(api, "/api/issues/search", components=key, resolved="false")
    hotspot_total = _total(api, "/api/hotspots/search", project=key, status="TO_REVIEW")
    if issue_total <= API_CAP:
        issues, _ = _pages(api, "/api/issues/search", "issues", components=key, resolved="false")
    else:
        if paths is None:
            raise Fail("too-many-findings", f"{issue_total} issues in the project and no changed-file list to narrow them")
        log(f"{issue_total} issues in the project; listing only the {len(paths)} changed files")
        issues = []
        for i in range(0, len(paths), PATH_BATCH):
            batch = ",".join(f"{key}:{p}" for p in paths[i:i + PATH_BATCH])
            issues += _pages(api, "/api/issues/search", "issues", components=batch, resolved="false")[0]
    if hotspot_total <= API_CAP:
        hotspots, _ = _pages(api, "/api/hotspots/search", "hotspots", project=key, status="TO_REVIEW")
    else:
        if paths is None:
            raise Fail("too-many-findings", f"{hotspot_total} hotspots in the project and no changed-file list to narrow them")
        hotspots = []
        for i in range(0, len(paths), PATH_BATCH):
            hotspots += _pages(api, "/api/hotspots/search", "hotspots", project=key, status="TO_REVIEW",
                               files=",".join(paths[i:i + PATH_BATCH]))[0]
    return {"issues": issues, "hotspots": hotspots, "projectTotal": issue_total + hotspot_total}


def split_findings(raw, changed):
    findings = [normalise(i, "issue") for i in raw.get("issues", [])] + \
               [normalise(h, "hotspot") for h in raw.get("hotspots", [])]
    new = [f for f in findings if is_new(f, changed)]
    in_changed_files = [f for f in findings if not is_new(f, changed) and f["path"] in changed]
    rank = lambda f: (-SEVERITY_ORDER.index(f["severity"]) if f["severity"] in SEVERITY_ORDER else 0, f["path"], f["startLine"] or 0)
    return sorted(new, key=rank), sorted(in_changed_files, key=rank), raw.get("projectTotal", len(findings))


def report_findings(root, base, out, raw, meta):
    ref, mb = resolve_base(root, base)
    changed = changed_lines(root, mb)
    new, older, total = split_findings(raw, changed)
    os.makedirs(out, exist_ok=True)
    payload = dict(meta, generatedAt=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                   base=ref, mergeBase=mb, tree=fingerprint(root), changedFiles=len(changed),
                   counts={"new": len(new),
                           "newIssues": sum(1 for f in new if f["kind"] == "issue"),
                           "newHotspots": sum(1 for f in new if f["kind"] == "hotspot"),
                           "preexistingInChangedFiles": len(older), "projectTotal": total},
                   newCode=new, preexistingInChangedFiles=older)
    path = os.path.join(out, "sonar-findings.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    emit(STATUS="ok", REASON="", FINDINGS_FILE=path, TREE=payload["tree"], BASE=ref,
         NEW=len(new), NEW_ISSUES=payload["counts"]["newIssues"], NEW_HOTSPOTS=payload["counts"]["newHotspots"],
         PREEXISTING_IN_CHANGED_FILES=len(older), PROJECT_TOTAL=total)
    for f in new:
        loc = f"{f['path']}:{f['startLine']}" if f["startLine"] else f["path"]
        print("NEW\t" + "\t".join([f["kind"], f["severity"], f["rule"], loc, f["key"], f["message"].replace("\t", " ")]))


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_detect(a):
    versions = load_versions()
    build = detect_build(a.root)
    java = detect_java(a.root, build)
    applied, version = gradle_plugin(a.root) if build == "gradle" else (False, None)
    emit(STATUS="ok" if build != "none" else "skip", REASON="" if build != "none" else "not-java",
         BUILD=build, JAVA=java or "", IMAGE=pick_server(java, versions) if build != "none" else "",
         GRADLE_PLUGIN=("applied " + (version or "")).strip() if applied else ("init-script" if build == "gradle" else ""),
         BUILD_JDK=f"{required_java(a.root, build)}+" if build != "none" else "",
         PROJECT_KEY=project_key(a.root) if build != "none" else "")


def server_lines(s):
    return dict(SONAR_URL=s["url"], SONAR_VERSION=s["version"], SONAR_IMAGE=s["image"], SONAR_CONTAINER=s["name"],
                PROFILE=s["profile"], PROFILE_RULES=f"{s['total'] - len(s['missing'])}/{s['total']}",
                MISSING_RULES=s["missing"], STOPPED=s["stopped"], STATE_FILE=os.path.join(state_home(), s["name"] + ".json"))


def cmd_server(a):
    if not sonar_enabled():
        raise Fail("disabled", "sonar.enabled is false in local settings", status="skip")
    s = ensure_server(a.root)
    emit(STATUS="ok", REASON="", **server_lines(s))


def cmd_scan(a):
    if not sonar_enabled():
        raise Fail("disabled", "sonar.enabled is false in local settings", status="skip")
    build = detect_build(a.root)
    if build == "none":
        raise Fail("not-java", "no pom.xml or build.gradle at the root", status="skip")
    t0 = time.time()
    s = ensure_server(a.root)
    server_seconds = round(time.time() - t0)
    emit(**server_lines(s))
    key, times = analyse(a.root, s, a.out)
    raw = fetch_all(s["api"], key, sorted(changed_lines(a.root, resolve_base(a.root, a.base)[1])))
    times = dict(serverSeconds=server_seconds, **times, totalSeconds=round(time.time() - t0))
    report_findings(a.root, a.base, a.out, raw,
                    {"projectKey": key, "server": s["version"], "image": s["image"], "profile": s["profile"],
                     "profileRules": f"{s['total'] - len(s['missing'])}/{s['total']}", "missingRules": s["missing"],
                     "timings": times})
    # Wall-clock seconds, for the ledger and the PR comment: how long a local scan takes.
    emit(SCAN_SECONDS=times["totalSeconds"], SERVER_SECONDS=times["serverSeconds"],
         ANALYSIS_SECONDS=times["analysisSeconds"], PROCESSING_SECONDS=times["processingSeconds"],
         PROJECT_KEY=key, DASHBOARD=f"{s['url']}/dashboard?id={urllib.parse.quote(key)}")


def cmd_findings(a):
    if a.from_file:
        with open(a.from_file, encoding="utf-8") as f:
            raw = json.load(f)
        meta = {"projectKey": "offline"}
    else:
        s = ensure_server(a.root)
        key = project_key(a.root)
        raw = fetch_all(s["api"], key, sorted(changed_lines(a.root, resolve_base(a.root, a.base)[1])))
        meta = {"projectKey": key, "server": s["version"], "image": s["image"], "profile": s["profile"]}
    report_findings(a.root, a.base, a.out, raw, meta)


def cmd_mark(a):
    s = ensure_server(a.root)
    api = s["api"]
    if a.hotspot:
        resolution = {"safe": "SAFE", "fixed": "FIXED", "acknowledged": "ACKNOWLEDGED"}.get(a.as_)
        if not resolution:
            raise Fail("bad-args", "a hotspot is marked safe, fixed, or acknowledged")
        api.post("/api/hotspots/change_status", hotspot=a.key, status="REVIEWED", resolution=resolution, comment=a.comment)
    else:
        if a.as_ not in ("falsepositive", "accept"):
            raise Fail("bad-args", "an issue is marked falsepositive or accept")
        api.post("/api/issues/do_transition", issue=a.key, transition=a.as_)
        api.post("/api/issues/add_comment", issue=a.key, text=a.comment)
    emit(STATUS="ok", REASON="", KEY=a.key, MARKED=a.as_)


def cmd_fingerprint(a):
    emit(STATUS="ok", REASON="", TREE=fingerprint(a.root))


def our_containers():
    res = docker("ps", "-a", "--filter", f"label={LABEL}=1", "--format", "{{.Names}}", check=False)
    return [n for n in (res.stdout or "").split() if n]


def cmd_stop(a):
    names = our_containers() if docker_ready() else []
    for n in names:
        docker("stop", n, check=False)
    emit(STATUS="ok", REASON="", STOPPED=names)


def cmd_reset(a):
    names = our_containers() if docker_ready() else []
    for n in names:
        docker("rm", "-f", n, check=False)
        docker("volume", "rm", f"{n}-data", f"{n}-extensions", check=False)
        try:
            os.unlink(os.path.join(state_home(), f"{n}.json"))
        except FileNotFoundError:
            pass
    emit(STATUS="ok", REASON="", REMOVED=names)


def main():
    p = argparse.ArgumentParser(description="Local SonarQube for emporix-feature sonar-scan")
    sub = p.add_subparsers(dest="cmd", required=True)
    root_arg = dict(default=".", help="repository root (the ticket checkout)")
    d = sub.add_parser("detect"); d.add_argument("--root", **root_arg); d.set_defaults(fn=cmd_detect)
    s = sub.add_parser("server"); s.add_argument("--root", **root_arg); s.set_defaults(fn=cmd_server)
    for name, fn in (("scan", cmd_scan), ("findings", cmd_findings)):
        x = sub.add_parser(name)
        x.add_argument("--root", **root_arg)
        x.add_argument("--base", default="auto")
        x.add_argument("--out", required=True, help="folder for sonar-findings.json and the scan log")
        if name == "findings":
            x.add_argument("--from-file", help="issues/hotspots JSON instead of the server (tests)")
        x.set_defaults(fn=fn)
    m = sub.add_parser("mark")
    m.add_argument("--root", **root_arg)
    m.add_argument("--key", required=True)
    m.add_argument("--as", dest="as_", required=True)
    m.add_argument("--comment", required=True)
    m.add_argument("--hotspot", action="store_true")
    m.set_defaults(fn=cmd_mark)
    fp = sub.add_parser("fingerprint"); fp.add_argument("--root", **root_arg); fp.set_defaults(fn=cmd_fingerprint)
    sub.add_parser("stop").set_defaults(fn=cmd_stop)
    sub.add_parser("reset").set_defaults(fn=cmd_reset)
    a = p.parse_args()
    if hasattr(a, "root"):
        a.root = os.path.abspath(a.root)
    try:
        a.fn(a)
    except Fail as e:
        log(str(e))
        emit(STATUS=e.status, REASON=e.reason, MESSAGE=str(e).replace("\n", " "))
        sys.exit(0 if e.status == "skip" else 1)


if __name__ == "__main__":
    main()
