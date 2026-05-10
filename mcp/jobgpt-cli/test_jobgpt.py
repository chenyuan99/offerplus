import pytest
from typer.testing import CliRunner
from unittest.mock import MagicMock, patch
from swelist.main import app

runner = CliRunner()

FAKE_RESPONSE = "This is a generated answer from the AI model."


def _mock_openai(monkeypatch):
    """Patch _call_openai to return a fake response without hitting the API."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    mock = MagicMock(return_value=FAKE_RESPONSE)
    monkeypatch.setattr("swelist.jobgpt._call_openai", mock)
    return mock


class TestWhyCompany:
    def test_requires_background(self):
        result = runner.invoke(app, ["jobgpt", "why-company", "Stripe"])
        assert result.exit_code != 0

    def test_generates_answer(self, monkeypatch):
        mock = _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "why-company", "Stripe", "--background", "5yr data engineering at AWS"],
        )
        assert result.exit_code == 0
        assert FAKE_RESPONSE in result.output
        mock.assert_called_once()
        system, user, model = mock.call_args.args
        assert "Stripe" in user
        assert "5yr data engineering" in user
        assert model == "gpt-4o-mini"

    def test_custom_model(self, monkeypatch):
        mock = _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "why-company", "Google", "--background", "SWE intern", "--model", "gpt-4o"],
        )
        assert result.exit_code == 0
        _, _, model = mock.call_args.args
        assert model == "gpt-4o"


class TestBehavioral:
    def test_generates_star_answer(self, monkeypatch):
        mock = _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "behavioral", "Tell me about a time you handled a conflict."],
        )
        assert result.exit_code == 0
        assert FAKE_RESPONSE in result.output
        system, user, _ = mock.call_args.args
        assert "STAR" in system
        assert "conflict" in user

    def test_missing_resume_warns_but_continues(self, monkeypatch, tmp_path):
        _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "behavioral", "Describe a challenge.", "--resume", "/nonexistent/resume.txt"],
        )
        assert result.exit_code == 0
        assert "Warning" in result.output or FAKE_RESPONSE in result.output

    def test_resume_file_included(self, monkeypatch, tmp_path):
        resume = tmp_path / "resume.txt"
        resume.write_text("Senior data engineer with Spark and Kafka experience.")
        mock = _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "behavioral", "Tell me about yourself.", "--resume", str(resume)],
        )
        assert result.exit_code == 0
        _, user, _ = mock.call_args.args
        assert "Spark" in user


class TestAsk:
    def test_generates_response(self, monkeypatch):
        mock = _mock_openai(monkeypatch)
        result = runner.invoke(
            app,
            ["jobgpt", "ask", "What salary should I negotiate for a senior SWE role in NYC?"],
        )
        assert result.exit_code == 0
        assert FAKE_RESPONSE in result.output
        mock.assert_called_once()

    def test_prompt_passed_through(self, monkeypatch):
        mock = _mock_openai(monkeypatch)
        prompt = "How do I negotiate remote work?"
        runner.invoke(app, ["jobgpt", "ask", prompt])
        _, user, _ = mock.call_args.args
        assert prompt in user


class TestMissingApiKey:
    def test_exits_without_api_key(self, monkeypatch):
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        result = runner.invoke(
            app,
            ["jobgpt", "why-company", "Meta", "--background", "ML engineer"],
        )
        assert result.exit_code != 0
        assert "OPENAI_API_KEY" in result.output
