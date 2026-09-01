#!/usr/bin/env python3
"""
Issue Enumerator - List issues, enumerate solutions, plan, and execute.
"""

import json
import os
import sys
from datetime import datetime

DATA_FILE = "issues.json"


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            return json.load(f)
    return {"issues": []}


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def list_issues(data):
    """Step 1: List all issues and their solutions."""
    issues = data.get("issues", [])
    if not issues:
        print("No issues found. Use 'add' to add an issue.")
        return
    print(f"\n{'#':<4} {'Issue':<30} {'Solutions'}")
    print("-" * 70)
    for i, issue in enumerate(issues, 1):
        solutions = issue.get("solutions", [])
        sol_str = "; ".join(solutions) if solutions else "(none)"
        print(f"{i:<4} {issue['title']:<30} {sol_str}")
    print()


def enumerate_solutions(data):
    """Step 2: Enumerate one solution per issue."""
    issues = data.get("issues", [])
    if not issues:
        print("No issues to enumerate solutions for.")
        return
    print("\nEnumerated solutions (one per issue):")
    print("-" * 50)
    for i, issue in enumerate(issues, 1):
        solutions = issue.get("solutions", [])
        chosen = solutions[0] if solutions else "No solution defined"
        issue["chosen_solution"] = chosen
        print(f"{i}. [{issue['title']}] -> {chosen}")
    print()
    save_data(data)


def make_plan(data):
    """Step 3: Make deployment plans for solutions."""
    issues = data.get("issues", [])
    if not issues:
        print("No issues to plan for.")
        return
    print("\nDeployment Plan:")
    print("=" * 50)
    plan = []
    for i, issue in enumerate(issues, 1):
        chosen = issue.get("chosen_solution") or (
            issue["solutions"][0] if issue.get("solutions") else None
        )
        if not chosen:
            continue
        step = {
            "step": i,
            "issue": issue["title"],
            "solution": chosen,
            "status": issue.get("status", "pending"),
            "planned_at": datetime.now().isoformat(),
        }
        plan.append(step)
        print(f"Step {i}: Resolve '{issue['title']}' by applying: {chosen}")
        print(f"        Status: {step['status']}")
    data["plan"] = plan
    save_data(data)
    print()


def execute_plan(data):
    """Step 4: Execute the plan."""
    plan = data.get("plan", [])
    if not plan:
        print("No plan found. Run 'plan' first.")
        return
    print("\nExecuting plan...")
    print("=" * 50)
    for step in plan:
        if step["status"] == "done":
            print(f"Step {step['step']}: '{step['issue']}' already done, skipping.")
            continue
        print(f"Step {step['step']}: Executing solution for '{step['issue']}'...")
        print(f"         Applying: {step['solution']}")
        step["status"] = "done"
        step["executed_at"] = datetime.now().isoformat()
        # Update matching issue status
        for issue in data.get("issues", []):
            if issue["title"] == step["issue"]:
                issue["status"] = "done"
        print(f"         Done.")
    save_data(data)
    print("\nAll steps executed.")


def add_issue(data, title, solutions=None):
    """Add a new issue with optional solutions."""
    issue = {
        "title": title,
        "solutions": solutions or [],
        "status": "open",
        "created_at": datetime.now().isoformat(),
    }
    data["issues"].append(issue)
    save_data(data)
    print(f"Added issue: {title}")


def print_usage():
    print(
        """
Usage: python issue_enumerator.py <command> [args]

Commands:
  list                        List all issues and solutions
  enumerate                   Enumerate one solution per issue
  plan                        Make deployment plans for solutions
  execute                     Execute the plan
  add <title> [sol1 sol2...]  Add a new issue with optional solutions
"""
    )


def main():
    data = load_data()
    args = sys.argv[1:]

    if not args:
        print_usage()
        return

    cmd = args[0]

    if cmd == "list":
        list_issues(data)
    elif cmd == "enumerate":
        enumerate_solutions(data)
    elif cmd == "plan":
        make_plan(data)
    elif cmd == "execute":
        execute_plan(data)
    elif cmd == "add":
        if len(args) < 2:
            print("Usage: add <title> [solution1 solution2 ...]")
            sys.exit(1)
        add_issue(data, args[1], args[2:])
    else:
        print(f"Unknown command: {cmd}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
