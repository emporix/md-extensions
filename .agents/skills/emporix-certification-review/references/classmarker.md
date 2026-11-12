# ClassMarker ingest

Primary path: [ClassMarker API](https://www.classmarker.com/online-testing/docs/api/).
Fallback: CSV exports in the **learning-certification** repo.

## Credentials

| Env | Required for API |
|-----|------------------|
| `CLASSMARKER_API_KEY` | yes |
| `CLASSMARKER_API_SECRET` | yes |

**Recommended local store:** `~/.emporix-classmarker.env` (mode `600`, never
committed). Example:

```bash
CLASSMARKER_API_KEY=…
CLASSMARKER_API_SECRET=…
```

`scripts/fetch-questions.sh` sources that file when the vars are unset.
Override the path with `CLASSMARKER_ENV_FILE`. Explicit env vars always win.

Create keys under ClassMarker → My Account → Webhooks / API Keys. Never commit
or print them. Missing either variable → skip API and use CSV fallback (unless
`--source api`, which is a hard stop).

## Authentication

Every request needs query params:

- `api_key`
- `timestamp` — Unix seconds (5-minute skew allowed)
- `signature` — lowercase SHA256 of `api_key + api_secret + timestamp`

Verification vector from ClassMarker docs:

- key `FHBSvPJl4hUSNyyPGxj56ihJyIRoxp1U`
- secret `AMrajbsvsoU7D2276YkRhqXO0hHgMDicxJdXMtVF`
- timestamp `1762783200`
- expected signature
  `3121ce3cec81a4bba3a05488318767b0a2c922f10e18e4aa64aefb4d02aee2cc`

## Endpoints used (read-only)

| Method | Path | Notes |
|--------|------|--------|
| GET | `https://api.classmarker.com/v1/questions.json?page=N` | 200 questions per page |
| GET | `https://api.classmarker.com/v1/questions/{id}.json` | optional single fetch |

Do **not** call `POST` / `PUT` question endpoints from this skill.

## Rate limits

Each API key: **30 requests per hour**. On `rateLimitExceeded`, read
`error.next_request_after` (Unix seconds). Persist the partial snapshot and
either:

- stop and tell the user when the next window opens, or
- resume later with `fetch-questions.sh --resume <snapshot.json>`.

Default fetch script budget: 28 requests per run (leave headroom).

## Snapshot shape

Write JSON:

```json
{
  "source": "classmarker_api",
  "fetched_at": "ISO-8601",
  "pages_fetched": [1, 2],
  "complete": true,
  "questions": [
    {
      "question_id": 53353203,
      "question": "…",
      "question_type": "multiplechoice",
      "category_id": 1,
      "parent_category": "",
      "category": "",
      "points": "1.0",
      "status": "active",
      "options": { "A": { "content": "…" }, "B": { "content": "…" } },
      "correct_options": ["A"]
    }
  ]
}
```

List responses already include options and correct keys for typical types; do
not issue a per-question GET unless a list row is incomplete.

## CSV fallback (learning-certification)

When API ingest fails or `--source csv`:

1. Resolve the **learning-certification** workspace folder (basename match).
   Missing → hard stop and ask to add it to the Cursor window (do not clone).
2. Load `questions-bank/ClassMarker_*.csv` (or `--csv` / `--bank` filter).
3. Known banks (stems under `questions-bank/`):

   - `ClassMarker_Sales_Specialist_Certification_test_questions.csv`
   - `ClassMarker_2_Sales_Specialist_Certification_test_questions.csv`
   - `ClassMarker_Solution_Developer_Certification_test_questions.csv`
   - `ClassMarker_Consultant_Expert_Certification_test_questions.csv`
   - `ClassMarker_Agentic_Commerce_Intelligence_test_questions.csv`

### CSV columns (ClassMarker export)

Header row (quoted names vary slightly by export):

`Question Type`, `Parent Category`, `Category`, `Random Answers`, `Grade Style`,
`Correct Feedback`, `Incorrect Feedback`, `Points`, `Question`, `Correct`,
`Answer A` … `Answer J`

Normalize each data row to the snapshot question shape:

| CSV | Snapshot |
|-----|----------|
| (file stem + row index) | `question_id` string e.g. `csv:Sales_Specialist:12` |
| Question Type | `question_type` |
| Parent Category / Category | `parent_category` / `category` |
| Question | `question` |
| Answer A–J (non-empty) | `options.A` … content |
| Correct (`A,B` or `A`) | `correct_options` list |
| Points | `points` |
| — | `status`: `active` |

Set snapshot `"source": "csv"` and `"path": "<relative or absolute csv>"`.
When multiple CSVs are loaded, concatenate `questions` and record `paths`.

## Scripts

```bash
FETCH=.agents/skills/emporix-certification-review/scripts/fetch-questions.sh
"$FETCH" --out .ai/certification/snapshots/$(date +%Y-%m-%d)/questions.json
"$FETCH" --out …/questions.json --resume …/questions.json --page 3
```

Exit codes: `0` success (complete or partial with resume info on stderr),
`2` usage, `3` missing credentials, `4` HTTP/API error, `5` rate limited
(partial written when possible).
