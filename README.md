# Combinator MVP

A tiny local web app for combinatorial creativity: take stock of **issues** (past and present) and **assets** (solutions, skills, tools, resources), then either randomly pair them or systematically sweep one against all.

No build step. No server. Data lives in your browser's `localStorage`.

## Run it

Just open `index.html` in a browser. On macOS:

```sh
open index.html
```

## Views

- **Pool** — add issues (with `chronic`/`occasional` + freeform type + where) and assets (solution/skill/tool/resource).
- **Shuffle** (Module A) — random issue × asset pairing. Options: chronic-only, prefer-unrated.
- **Enumerate** (Module B) — pick one anchor, see it paired against every item of the other kind.

Each pairing can be rated (👎 🤔 👍 ⭐) and elaborated with a "how deployed / outcome" note. History accumulates per pairing.

## Data

- **Export** button → download JSON snapshot.
- **Import** button → replace current data from a JSON file.

Storage key: `combinator:v1` in `localStorage`.

## Structure

- `index.html` — markup + template
- `style.css` — styling
- `app.js` — all logic (data model, views, shuffle/enumerate)
