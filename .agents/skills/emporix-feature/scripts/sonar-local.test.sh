#!/usr/bin/env sh
# Behaviour tests for sonar-local.py that need no Docker and no server:
# build and Java detection, the new-code split, the tree fingerprint, and the
# local opt-out. The server path is exercised by a real `scan`.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
SONAR="$ROOT/skills/emporix-feature/scripts/sonar-local.py"
PROFILE="$ROOT/skills/emporix-feature/assets/sonar/emporix-java-profile.xml"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }
sonar() { python3 -I "$SONAR" "$@"; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)
export EMPORIX_SETTINGS_FILE="$TMP/settings.json"
export EMPORIX_SONAR_HOME="$TMP/sonar-home"

# Profile: every rule names a repository and a key, and the file is well-formed XML.
python3 -I -c 'import sys,xml.dom.minidom as m; m.parse(sys.argv[1])' "$PROFILE" || fail "profile is not valid XML"
rules=$(grep -c '<rule>' "$PROFILE")
[ "$rules" -ge 400 ] || fail "profile should hold the Emporix rules, has $rules"

# Detection: no build file → skip as not-java.
mkdir -p "$TMP/none"
out=$(sonar detect --root "$TMP/none")
[ "$(field "$out" STATUS)" = skip ] && [ "$(field "$out" REASON)" = not-java ] || fail "no build file should skip: $out"

# Maven with Java 1.8 → java 8.
mkdir -p "$TMP/mvn"
printf '<project><properties><java.version>1.8</java.version></properties></project>\n' >"$TMP/mvn/pom.xml"
out=$(sonar detect --root "$TMP/mvn")
[ "$(field "$out" BUILD)" = maven ] && [ "$(field "$out" JAVA)" = 8 ] || fail "maven 1.8: $out"

# Gradle with the plugin applied and a toolchain → plugin version and Java level.
mkdir -p "$TMP/gr"
cat >"$TMP/gr/build.gradle" <<'EOF'
plugins {
    id 'java'
    id "org.sonarqube" version "7.5.0.8588"
}
java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }
EOF
out=$(sonar detect --root "$TMP/gr")
[ "$(field "$out" BUILD)" = gradle ] || fail "gradle build: $out"
[ "$(field "$out" JAVA)" = 21 ] || fail "gradle toolchain 21: $out"
[ "$(field "$out" GRADLE_PLUGIN)" = "applied 7.5.0.8588" ] || fail "gradle plugin: $out"

# Plugin version pinned through gradle.properties → resolved, for `${name}` and `$name`.
cat >"$TMP/gr/build.gradle" <<'EOF'
plugins {
    id "org.sonarqube" version "${sonarqubePluginVersion}"
}
EOF
printf '# pinned versions\nsonarqubePluginVersion=7.5.0.8588\nlegacySonar = 3.5.0.2730\n' >"$TMP/gr/gradle.properties"
out=$(sonar detect --root "$TMP/gr")
[ "$(field "$out" STATUS)" = ok ] && [ "$(field "$out" GRADLE_PLUGIN)" = "applied 7.5.0.8588" ] || fail "gradle plugin from \${property}: $out"
printf 'plugins { id "org.sonarqube" version "$legacySonar" }\n' >"$TMP/gr/build.gradle"
out=$(sonar detect --root "$TMP/gr")
[ "$(field "$out" GRADLE_PLUGIN)" = "applied 3.5.0.2730" ] || fail "gradle plugin from \$property: $out"

# A property missing from gradle.properties → applied, version unknown, no traceback.
printf 'plugins { id "org.sonarqube" version "${noSuchVersion}" }\n' >"$TMP/gr/build.gradle"
out=$(sonar detect --root "$TMP/gr")
[ "$(field "$out" STATUS)" = ok ] && [ "$(field "$out" GRADLE_PLUGIN)" = applied ] || fail "unresolvable plugin version: $out"
rm -f "$TMP/gr/gradle.properties"

# Gradle without the plugin → an init script applies it.
printf 'plugins { id "java" }\nsourceCompatibility = JavaVersion.toVersion("17")\n' >"$TMP/gr/build.gradle"
out=$(sonar detect --root "$TMP/gr")
[ "$(field "$out" GRADLE_PLUGIN)" = init-script ] && [ "$(field "$out" JAVA)" = 17 ] || fail "gradle without plugin: $out"

# A project newer than every pinned image fails instead of scanning with the wrong analyzer.
printf '<project><properties><maven.compiler.release>99</maven.compiler.release></properties></project>\n' >"$TMP/mvn/pom.xml"
if out=$(sonar detect --root "$TMP/mvn" 2>/dev/null); then fail "java 99 should fail: $out"; fi
[ "$(field "$out" REASON)" = java-unsupported ] || fail "java 99 reason: $out"

# Opt-out in local settings → scan skips before touching Docker.
printf '{"sonar":{"enabled":false}}\n' >"$EMPORIX_SETTINGS_FILE"
out=$(sonar scan --root "$TMP/gr" --base main --out "$TMP/out" 2>/dev/null)
[ "$(field "$out" STATUS)" = skip ] && [ "$(field "$out" REASON)" = disabled ] || fail "disabled should skip: $out"
rm -f "$EMPORIX_SETTINGS_FILE"

# New code: a repository with a base commit, one committed edit, one uncommitted edit, one new file.
R="$TMP/repo"
git init -q -b main "$R"
g() { git -C "$R" -c user.email=t@example.com -c user.name=t "$@"; }
mkdir -p "$R/src"
seq 1 20 | sed 's/^/line /' >"$R/src/Old.java"
seq 1 20 | sed 's/^/keep /' >"$R/src/Untouched.java"
g add -A && g commit -q -m base
g checkout -q -b COP-1-x
sed -i.bak 's/^line 5$/line five/' "$R/src/Old.java" && rm "$R/src/Old.java.bak"
g commit -q -am "edit line 5"
sed -i.bak 's/^line 12$/line twelve/' "$R/src/Old.java" && rm "$R/src/Old.java.bak"
printf 'class New {}\n' >"$R/src/New.java"

cat >"$TMP/raw.json" <<'EOF'
{"issues": [
  {"key": "i-committed", "rule": "java:S1", "component": "p:src/Old.java", "line": 5, "textRange": {"startLine": 5, "endLine": 5}, "message": "on a committed edit", "impacts": [{"softwareQuality": "MAINTAINABILITY", "severity": "LOW"}]},
  {"key": "i-dirty", "rule": "java:S2", "component": "p:src/Old.java", "line": 11, "textRange": {"startLine": 11, "endLine": 13}, "message": "range covers the uncommitted edit", "impacts": [{"softwareQuality": "RELIABILITY", "severity": "HIGH"}]},
  {"key": "i-old-line", "rule": "java:S3", "component": "p:src/Old.java", "line": 1, "message": "pre-existing in a changed file", "severity": "MAJOR"},
  {"key": "i-untouched", "rule": "java:S4", "component": "p:src/Untouched.java", "line": 3, "message": "pre-existing elsewhere", "severity": "MAJOR"},
  {"key": "i-new-file", "rule": "java:S5", "component": "p:src/New.java", "message": "file-level issue on a new file", "severity": "MINOR"}
], "hotspots": [
  {"key": "h-new", "ruleKey": "java:S6", "component": "p:src/Old.java", "line": 12, "message": "hotspot on the uncommitted edit", "vulnerabilityProbability": "MEDIUM"}
]}
EOF
out=$(sonar findings --root "$R" --base main --out "$TMP/out" --from-file "$TMP/raw.json")
[ "$(field "$out" STATUS)" = ok ] || fail "findings: $out"
[ "$(field "$out" NEW)" = 4 ] || fail "4 findings sit on new code: $out"
[ "$(field "$out" NEW_HOTSPOTS)" = 1 ] || fail "1 new hotspot: $out"
[ "$(field "$out" PREEXISTING_IN_CHANGED_FILES)" = 1 ] || fail "1 pre-existing finding in a changed file: $out"
[ "$(field "$out" PROJECT_TOTAL)" = 6 ] || fail "6 findings in total: $out"
# Emitted order: most severe first, then by path and line (HIGH, MEDIUM, LOW src/New.java, LOW src/Old.java).
new_keys=$(printf '%s\n' "$out" | awk -F'\t' '/^NEW\t/ {print $6}' | tr '\n' ' ')
[ "$new_keys" = "i-dirty h-new i-new-file i-committed " ] || fail "new-code keys in severity order: $new_keys"
new_severities=$(printf '%s\n' "$out" | awk -F'\t' '/^NEW\t/ {print $3}' | tr '\n' ' ')
[ "$new_severities" = "HIGH MEDIUM LOW LOW " ] || fail "the most severe finding comes first, got $new_severities"
python3 -I -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["counts"]["new"] == 4 and d["base"] == "main"' "$TMP/out/sonar-findings.json" \
  || fail "sonar-findings.json should carry the counts and the base"

# Fingerprint: stable on an unchanged tree, different after any edit (tracked or untracked).
fp1=$(field "$(sonar fingerprint --root "$R")" TREE)
fp2=$(field "$(sonar fingerprint --root "$R")" TREE)
[ "$fp1" = "$fp2" ] || fail "fingerprint should be stable"
printf 'class New { int x; }\n' >"$R/src/New.java"
fp3=$(field "$(sonar fingerprint --root "$R")" TREE)
[ "$fp1" != "$fp3" ] || fail "fingerprint should change with an untracked edit"

# Committing the scanned content keeps the fingerprint (a Verdict taken before
# `pr` commits still matches the pushed head), and the real index is untouched.
staged_before=$(git -C "$R" diff --cached --name-only)
fp4=$(field "$(sonar fingerprint --root "$R")" TREE)
[ "$(git -C "$R" diff --cached --name-only)" = "$staged_before" ] || fail "fingerprint must not stage files"
g add -A && g commit -q -m "ship"
fp5=$(field "$(sonar fingerprint --root "$R")" TREE)
[ "$fp4" = "$fp5" ] || fail "commit of the same content should keep the fingerprint ($fp4 vs $fp5)"

# Ignored files (build output) do not change it.
printf 'build/\n' >"$R/.gitignore" && g add .gitignore && g commit -q -m ignore
fp6=$(field "$(sonar fingerprint --root "$R")" TREE)
mkdir -p "$R/build" && printf 'x' >"$R/build/out.class"
[ "$fp6" = "$(field "$(sonar fingerprint --root "$R")" TREE)" ] || fail "ignored files should not change the fingerprint"

# Function-level checks (state file mode, JDK lookup, missing build tool, API cap).
mkdir -p "$TMP/old/bin" "$TMP/new/bin" "$TMP/j21/bin" "$TMP/j25/bin"
printf '#!/bin/sh\necho %s >&2\n' "'openjdk version \"1.8.0_392\"'" >"$TMP/old/bin/java"
printf '#!/bin/sh\necho %s >&2\n' "'openjdk version \"17.0.12\" 2024-07-16'" >"$TMP/new/bin/java"
printf '#!/bin/sh\necho %s >&2\n' "'openjdk version \"21.0.3\" 2024-04-16'" >"$TMP/j21/bin/java"
printf '#!/bin/sh\necho %s >&2\n' "'openjdk version \"25\" 2025-09-16'" >"$TMP/j25/bin/java"
chmod +x "$TMP/old/bin/java" "$TMP/new/bin/java" "$TMP/j21/bin/java" "$TMP/j25/bin/java"
SONAR_PY="$SONAR" TMPD="$TMP" python3 -I -B - <<'EOF' || fail "function-level checks"
import importlib.util, os, stat, sys
spec = importlib.util.spec_from_file_location("sonar_local", os.environ["SONAR_PY"])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
tmp = os.environ["TMPD"]

def check(cond, msg):
    if not cond:
        print("FAIL:", msg, file=sys.stderr); sys.exit(1)

def fails(fn, reason):
    try:
        fn()
    except m.Fail as e:
        return e.reason == reason
    return False

# State file: mode 600 and directory 700 even when they already existed wider.
home = os.path.join(tmp, "state"); os.makedirs(home); os.chmod(home, 0o755)
os.environ["EMPORIX_SONAR_HOME"] = home
for name in ("c.json", "c.json.tmp"):
    with open(os.path.join(home, name), "w") as f: f.write("{}")
    os.chmod(os.path.join(home, name), 0o644)
m.write_state("c", {"password": "x", "token": "y"})
check(stat.S_IMODE(os.stat(os.path.join(home, "c.json")).st_mode) == 0o600, "state file should be 600")
check(stat.S_IMODE(os.stat(home).st_mode) == 0o700, "state directory should be 700")
check(not os.path.exists(os.path.join(home, "c.json.tmp")), "no tmp file left")
check(m.read_state("c")["token"] == "y", "state round-trips")

# JDK: an old JAVA_HOME is replaced by the first installed 11+ home, on any platform.
old, new = os.path.join(tmp, "old"), os.path.join(tmp, "new")
check(m.find_java_home([old, new]) == (new, 17), "find_java_home picks the 11+ home")
check(m.find_java_home([old]) == (None, None), "no 11+ home → none")
os.environ["JAVA_HOME"] = old
env = m.scanner_env("t", "u", candidates=[old, new])
check(env["JAVA_HOME"] == new and env["PATH"].startswith(os.path.join(new, "bin")), "scanner_env switches to the 11+ JDK")
check(fails(lambda: m.scanner_env("t", "u", candidates=[old]), "java-too-old"), "no newer JDK → java-too-old")

# Build JDK: a build that compiles for Java 21 without a toolchain cannot run on a JDK 17 JAVA_HOME
# (`invalid source release: 21`); the closest installed JDK at or above 21 is used, not the newest.
j21, j25 = os.path.join(tmp, "j21"), os.path.join(tmp, "j25")
check(m.find_java_home([j25, new, j21], 21) == (j21, 21), "find_java_home picks the closest home at or above the minimum")
check(m.find_java_home([j25, new], 21) == (j25, 25), "a newer home when the exact major is missing")
os.environ["JAVA_HOME"] = new
check(m.scanner_env("t", "u", 11, candidates=[j21])["JAVA_HOME"] == new, "a JAVA_HOME that is new enough is kept")
check(m.scanner_env("t", "u", 21, candidates=[j25, new, j21])["JAVA_HOME"] == j21, "JDK 17 → the installed JDK 21")
check(fails(lambda: m.scanner_env("t", "u", 21, candidates=[old, new]), "java-too-old"), "no JDK 21+ → java-too-old")
def need(files, build="gradle"):
    d = os.path.join(tmp, "rj-" + str(abs(hash(str(files))))); os.makedirs(d, exist_ok=True)
    for name, text in files.items():
        os.makedirs(os.path.dirname(os.path.join(d, name)), exist_ok=True)
        with open(os.path.join(d, name), "w") as f: f.write(text)
    return m.required_java(d, build)
check(need({"build.gradle": 'java { sourceCompatibility = JavaVersion.toVersion("21") }'}) == 21, "Gradle release 21, no toolchain → 21")
check(need({"build.gradle": "java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }"}) == 11, "Gradle toolchain → 11")
check(need({"build.gradle": "sourceCompatibility = '1.8'"}) == 11, "Java 8 → the scanners' 11")
check(need({"pom.xml": "<properties><maven.compiler.release>17</maven.compiler.release></properties>"}, "maven") == 17, "Maven release 17 → 17")
check(need({"pom.xml": "<release>21</release><artifactId>maven-toolchains-plugin</artifactId>"}, "maven") == 11, "Maven toolchains → 11")
# The build tool's own minimum: Gradle 9 and Maven 4 start only on Java 17+, toolchain or not.
toolchain = "java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }"
wrapper = "gradle/wrapper/gradle-wrapper.properties"
def gradle_wrapper(version):
    return {wrapper: f"distributionUrl=https\\://services.gradle.org/distributions/gradle-{version}-bin.zip\n"}
check(need({"build.gradle": toolchain, **gradle_wrapper("9.1.0")}) == 17, "Gradle 9 + toolchain → 17")
check(need({"build.gradle": toolchain, **gradle_wrapper("8.7")}) == 11, "Gradle 8 + toolchain → 11")
check(need({"build.gradle": 'sourceCompatibility = "21"', **gradle_wrapper("9.0-rc-1")}) == 21, "Gradle 9, release 21 → 21")
check(need({"pom.xml": "<artifactId>maven-toolchains-plugin</artifactId>",
            ".mvn/wrapper/maven-wrapper.properties": "distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/4.0.0/apache-maven-4.0.0-bin.zip\n"},
           "maven") == 17, "Maven 4 wrapper → 17")
check(m.build_tool_java(os.path.join(tmp, "nowhere"), "gradle") == 8, "no wrapper → no extra floor")

# Missing build tool: Fail(build-failed), and the Gradle init script is removed.
init = os.path.join(tmp, "init.gradle"); open(init, "w").close()
check(fails(lambda: m.run_build([os.path.join(tmp, "no-such-gradlew")], tmp, dict(os.environ),
                                os.path.join(tmp, "b.log"), init), "build-failed"), "missing tool → build-failed")
check(not os.path.exists(init), "init script removed after a failed start")

# Gradle task: `sonarqube` only for a known plugin major below 4; literal, property-pinned,
# unresolvable, and non-numeric versions never crash and default to `sonar`.
versions = m.load_versions()
def gradle_task(build_gradle, properties=None):
    d = os.path.join(tmp, "gt"); os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "build.gradle"), "w") as f: f.write(build_gradle)
    gp = os.path.join(d, "gradle.properties")
    if properties is None:
        if os.path.exists(gp): os.remove(gp)
    else:
        with open(gp, "w") as f: f.write(properties)
    cmd, init_path = m.analysis_command(d, "gradle", "k", "http://x", versions)
    check(init_path is None, "an applied plugin needs no init script")
    return [t for t in ("sonar", "sonarqube") if t in cmd]
check(gradle_task('plugins { id "org.sonarqube" version "7.5.0.8588" }') == ["sonar"], "literal 7.x → sonar")
check(gradle_task('plugins { id "org.sonarqube" version "3.5.0.2730" }') == ["sonarqube"], "literal 3.x → sonarqube")
check(gradle_task('plugins { id "org.sonarqube" version "${v}" }', "v=7.5.0.8588\n") == ["sonar"], "property 7.x → sonar")
check(gradle_task('plugins { id "org.sonarqube" version "$v" }', "v: 3.5.0.2730\n") == ["sonarqube"], "property 3.x → sonarqube")
check(gradle_task('plugins { id "org.sonarqube" version "${v}" }') == ["sonar"], "unresolvable → sonar")
check(gradle_task('plugins { id "org.sonarqube" version "${v}" }', "other=1\n") == ["sonar"], "missing property → sonar")
check(gradle_task('plugins { id "org.sonarqube" version "latest.release" }') == ["sonar"], "non-numeric → sonar")
check(m.gradle_plugin(os.path.join(tmp, "gt")) == (True, "latest.release"), "a non-numeric literal is reported as written")

# API cap: past 10,000 issues only the changed files are listed, and nothing is cut off.
class Api:
    def __init__(self, issues_total, files):
        self.issues_total, self.files, self.calls = issues_total, files, []
    def get(self, path, ps, p, **q):
        self.calls.append((path, q))
        if path.endswith("hotspots/search"):
            return {"hotspots": [], "paging": {"total": 0}}
        comps = q["components"].split(",")
        if comps == ["k"]:
            check(ps == 1, "the unscoped issue search is only counted past the cap")
            return {"issues": [], "paging": {"total": self.issues_total}}
        found = [{"key": f"i{c}", "component": c} for c in comps if c.split(":", 1)[1] in self.files]
        return {"issues": found[(p - 1) * ps:p * ps], "paging": {"total": len(found)}}

paths = [f"src/F{i}.java" for i in range(120)]
api = Api(12000, set(paths[::10]))
raw = m.fetch_all(api, "k", paths)
check(len(raw["issues"]) == 12, f"every changed file's issues listed, got {len(raw['issues'])}")
check(raw["projectTotal"] == 12000, "project total is the server's count")
check(sum(1 for c in api.calls if c[1].get("components", "").count(",") >= 1) == 3, "120 paths → 3 batches of 50")
check(fails(lambda: m.fetch_all(Api(12000, set()), "k", None), "too-many-findings"), "past the cap without paths → fail")
EOF

echo "sonar-local.test.sh: ok"
