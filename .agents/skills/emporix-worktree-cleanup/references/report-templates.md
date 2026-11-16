# Reports

```text
Issue: {KEY or none}
Primary: {primary path}
Removed: {path} ({branch})
Preserved: {each PRESERVED= path, relative to the primary; *.from-{folder}[-n] ones sit beside a different copy} | none
Deleted branch: {name or none}
Ready: yes
```

Repeat `Removed:` once per path (product and each docs repo). `Ready: no` if
the script refused (dirty, unpushed, or primary). Quote that reason.

When `--all-merged` and nothing qualified:

```text
Removed: none
Ready: yes
```
