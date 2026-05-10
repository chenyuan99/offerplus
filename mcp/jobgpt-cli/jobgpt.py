import os
import sys
from enum import Enum
from typing import Optional

import typer
from rich import print
from rich.markdown import Markdown
from rich.panel import Panel

jobgpt_app = typer.Typer(
    name="jobgpt",
    help="AI writing assistant for job applications.",
    no_args_is_help=True,
)

# ---------------------------------------------------------------------------
# Prompt templates (mirrored from offerplus PromptManager logic)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPTS = {
    "why_company": (
        "You are an expert career coach helping candidates craft compelling, authentic answers "
        "to the 'Why do you want to work at [Company]?' interview question. "
        "Write in first person. Be specific, enthusiastic, and concise (2-3 paragraphs). "
        "Ground the answer in the candidate's actual background."
    ),
    "behavioral": (
        "You are an expert career coach helping candidates answer behavioral interview questions "
        "using the STAR method (Situation, Task, Action, Result). "
        "Write in first person. Be concrete and quantify results where possible. "
        "Keep the answer under 400 words."
    ),
    "general": (
        "You are an expert career coach and job application strategist. "
        "Provide clear, actionable, and tailored advice."
    ),
}

_USER_TEMPLATES = {
    "why_company": (
        "Company: {company}\n\n"
        "My background: {background}\n\n"
        "Write a compelling answer to 'Why do you want to work at {company}?' "
        "that connects my background to what this company is known for."
    ),
    "behavioral": (
        "Behavioral question: {question}\n\n"
        "{resume_section}"
        "Write a strong STAR-method answer for this question."
    ),
    "general": "{prompt}",
}


# ---------------------------------------------------------------------------
# OpenAI helper
# ---------------------------------------------------------------------------

def _call_openai(system: str, user: str, model: str) -> str:
    try:
        from openai import OpenAI
    except ImportError:
        print(
            "[bold red]Error:[/bold red] openai package not installed. "
            "Run: [cyan]pip install 'swelist[ai]'[/cyan]"
        )
        raise typer.Exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print(
            "[bold red]Error:[/bold red] OPENAI_API_KEY environment variable not set.\n"
            "Export it with: [cyan]export OPENAI_API_KEY=sk-...[/cyan]"
        )
        raise typer.Exit(1)

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=600,
    )
    return response.choices[0].message.content.strip()


def _render(title: str, content: str, copy: bool) -> None:
    print(Panel(Markdown(content), title=f"[bold]{title}[/bold]", border_style="cyan"))
    if copy:
        try:
            import subprocess
            proc = subprocess.run(["xclip", "-selection", "clipboard"], input=content.encode(), check=False)
            if proc.returncode != 0:
                subprocess.run(["pbcopy"], input=content.encode(), check=True)
            print("[dim]Copied to clipboard.[/dim]")
        except Exception:
            print("[dim yellow]Could not copy to clipboard (install xclip or pbcopy).[/dim yellow]")


# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

@jobgpt_app.command("why-company")
def why_company(
    company: str = typer.Argument(..., help="Company name, e.g. 'Stripe'"),
    background: str = typer.Option(
        ..., "--background", "-b",
        help="Brief summary of your experience and skills.",
    ),
    model: str = typer.Option("gpt-4o-mini", "--model", "-m", help="OpenAI model to use."),
    copy: bool = typer.Option(False, "--copy", "-c", help="Copy output to clipboard."),
):
    """Generate a 'Why [Company]?' answer tailored to your background."""
    user_prompt = _USER_TEMPLATES["why_company"].format(
        company=company, background=background
    )
    print(f"[dim]Generating why-company answer for [bold]{company}[/bold]...[/dim]")
    result = _call_openai(_SYSTEM_PROMPTS["why_company"], user_prompt, model)
    _render(f"Why {company}?", result, copy)


@jobgpt_app.command("behavioral")
def behavioral(
    question: str = typer.Argument(..., help="The behavioral interview question."),
    resume: Optional[str] = typer.Option(
        None, "--resume", "-r",
        help="Path to a plain-text resume file for context.",
    ),
    model: str = typer.Option("gpt-4o-mini", "--model", "-m", help="OpenAI model to use."),
    copy: bool = typer.Option(False, "--copy", "-c", help="Copy output to clipboard."),
):
    """Generate a STAR-method answer for a behavioral interview question."""
    resume_section = ""
    if resume:
        try:
            resume_text = open(resume).read()[:2000]
            resume_section = f"My resume (excerpt):\n{resume_text}\n\n"
        except FileNotFoundError:
            print(f"[bold yellow]Warning:[/bold yellow] Resume file not found: {resume}")

    user_prompt = _USER_TEMPLATES["behavioral"].format(
        question=question, resume_section=resume_section
    )
    print("[dim]Generating behavioral answer...[/dim]")
    result = _call_openai(_SYSTEM_PROMPTS["behavioral"], user_prompt, model)
    _render("Behavioral Answer (STAR)", result, copy)


@jobgpt_app.command("ask")
def ask(
    prompt: str = typer.Argument(..., help="Your job-related question or prompt."),
    model: str = typer.Option("gpt-4o-mini", "--model", "-m", help="OpenAI model to use."),
    copy: bool = typer.Option(False, "--copy", "-c", help="Copy output to clipboard."),
):
    """Ask any job-related question (salary negotiation, career advice, resume edits, etc.)."""
    user_prompt = _USER_TEMPLATES["general"].format(prompt=prompt)
    print("[dim]Thinking...[/dim]")
    result = _call_openai(_SYSTEM_PROMPTS["general"], user_prompt, model)
    _render("JobGPT", result, copy)
