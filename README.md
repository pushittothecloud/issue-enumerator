# issue-enumerator

A simple CLI tool to list issues and solutions, enumerate one solution per issue, make a deployment plan, and execute it.

## Usage

```bash
# Add issues with solutions
python issue_enumerator.py add "Sleep quality" "Go to bed earlier" "Reduce caffeine"
python issue_enumerator.py add "Low energy" "Exercise daily" "Improve diet"
python issue_enumerator.py add "Procrastination" "Time-box tasks"

# Step 1: List all issues and solutions
python issue_enumerator.py list

# Step 2: Enumerate one solution per issue
python issue_enumerator.py enumerate

# Step 3: Make a deployment plan
python issue_enumerator.py plan

# Step 4: Execute the plan
python issue_enumerator.py execute
```

## Data

Issues and plans are persisted in `issues.json` in the current directory.

## Tests

```bash
python -m pytest tests/
```
