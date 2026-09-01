import json
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import issue_enumerator as ie


@pytest.fixture(autouse=True)
def tmp_data_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(ie, "DATA_FILE", str(tmp_path / "issues.json"))


def make_data(*titles_and_solutions):
    issues = []
    for title, solutions in titles_and_solutions:
        issues.append({"title": title, "solutions": solutions, "status": "open"})
    return {"issues": issues}


def test_load_data_missing_file():
    data = ie.load_data()
    assert data == {"issues": []}


def test_add_issue():
    data = ie.load_data()
    ie.add_issue(data, "Problem A", ["Fix A1", "Fix A2"])
    loaded = ie.load_data()
    assert len(loaded["issues"]) == 1
    assert loaded["issues"][0]["title"] == "Problem A"
    assert loaded["issues"][0]["solutions"] == ["Fix A1", "Fix A2"]


def test_enumerate_solutions_picks_first(capsys):
    data = make_data(("Issue 1", ["Sol A", "Sol B"]), ("Issue 2", ["Sol C"]))
    ie.enumerate_solutions(data)
    assert data["issues"][0]["chosen_solution"] == "Sol A"
    assert data["issues"][1]["chosen_solution"] == "Sol C"


def test_enumerate_solutions_no_solutions(capsys):
    data = make_data(("Issue 1", []))
    ie.enumerate_solutions(data)
    assert data["issues"][0]["chosen_solution"] == "No solution defined"


def test_make_plan_creates_steps(capsys):
    data = make_data(("Issue 1", ["Fix 1"]), ("Issue 2", ["Fix 2"]))
    ie.enumerate_solutions(data)
    ie.make_plan(data)
    assert "plan" in data
    assert len(data["plan"]) == 2
    assert data["plan"][0]["solution"] == "Fix 1"
    assert data["plan"][1]["solution"] == "Fix 2"


def test_execute_plan_marks_done(capsys):
    data = make_data(("Issue 1", ["Fix 1"]))
    ie.enumerate_solutions(data)
    ie.make_plan(data)
    ie.execute_plan(data)
    assert data["plan"][0]["status"] == "done"
    assert data["issues"][0]["status"] == "done"


def test_execute_plan_skips_done(capsys):
    data = make_data(("Issue 1", ["Fix 1"]))
    ie.enumerate_solutions(data)
    ie.make_plan(data)
    ie.execute_plan(data)
    ie.execute_plan(data)
    out = capsys.readouterr().out
    assert "already done" in out
