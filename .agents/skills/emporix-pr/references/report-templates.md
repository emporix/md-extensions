# Reports

Chat only. Do not paste comment bodies or the diff. The plan file is the record.

## Plan (solo — then stop)

```text
PR plan: {plan path}
PR: #{number} ({url}) · {headRefName} → {baseRefName} · head {short sha}
Issue plan: {path | none}
Items: {n} — Fix {f} · Nit {n} · Question {q} · Already done {a} · Disagree {d} · Out of scope {o} · Skip {s}
Plan impact: {rows with non-none impact, one line each | none}
Replies I will post as you: {Question / Disagree / Out of scope rows with the proposed text, one line each | none}
Conflicts / blocking: {none | one line}
Status: draft
Approve, change something, or cancel?
```

## Apply

```text
PR: #{number} ({url})
Plan: {plan path}
Fixed: {k} of {f} Fix · {n} Nit · replied {r} · resolved {t} ({resolve failed: …})
Tests: added/extended {paths | none (docs only)} · ran {commands} — green
Plan conformance: clean | {k} deviation(s) accepted | stopped on deviation
Bugbot: clean after {n} run(s) | cap — {remaining one-liners}
Format: {command | none}
Ship: {short push_sha} via emporix-feature pr | not shipped — {reason}
Ready: yes | ship | no
```

`Ready: yes` — pushed, threads answered and resolved. `Ready: ship` — ship gate green but the run stopped before ship on the user's words; tree uncommitted; `/emporix-pr apply` resumes. `Ready: no` — a gate failed, a Fix could not be applied, a deviation was rejected with nothing shippable, or the `pr` stage refused; say which and how to resume (`/emporix-pr apply` after the fix, or `/emporix-pr plan` when the plan is stale). Same vocabulary as `emporix-feature`: `Ready: {next step}` = waiting for the user, `yes` = done, `no` = blocked.

When the Bugbot cap or a rejected deviation left items open, list them one line each (ID — location — what remains).

**Unattended run** (`auto`, piped `plan | apply`): add a `For you to answer:` block listing every Question / Disagree / Out of scope row with the proposed reply. Those threads were left open on purpose.

## Auto cycle (one block per cycle, keep updated)

```text
emporix-pr auto {n}/{max}: plan={items} apply={yes|no} conformance={clean|accepted|rejected} ship={sha|no} watch={approved|changes-requested|pre-push|sonar|summary|quiet|timeout}
PR: #{number} ({url})
Fixed this cycle: {count}
```

`pre-push` — the outstanding check found an unresolved item that predates this push. `summary` — a finding named only in a review body.

## Auto final

```text
PR: #{number} ({url})
Branch: {headRefName}
Cycles: {n} of {max}
Fixed: {total across cycles}
Plan conformance: clean | {k} deviation(s) accepted (issue plan amended) | stopped on deviation
Review state: approved | changes requested | quiet ({timeout} min) | closed
For you to answer: {n} open thread(s) — listed below | none
Ready: yes | no
```

With `Ready: no`, say why the chain stopped (cap, gate red, Bugbot cap, deviation rejected, timeout, PR closed) and how to resume: `/emporix-pr auto {pr}` picks up from the current review state. At the cap, list the still-open actionable items (unresolved threads, Sonar, summary-only findings), one line each.
