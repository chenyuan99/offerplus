#!/usr/bin/env python3
"""
Job application tracker that reads Gmail and produces application_status.json.

Usage:
    python update_application_status.py [--output PATH] [--days N]

Requirements:
    pip install google-auth google-auth-httplib2 google-api-python-client

Auth (choose one):
    Local:  gcloud auth application-default login \\
                --scopes=https://www.googleapis.com/auth/gmail.readonly
    CI/CD:  set GOOGLE_APPLICATION_CREDENTIALS to a service account key path,
            or export ADC via: gcloud auth application-default print-access-token
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Gmail API setup
# ---------------------------------------------------------------------------
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

OUTPUT_PATH = Path(__file__).parent.parent / "application_status.json"


def get_gmail_service():
    """Authenticate via Application Default Credentials and return Gmail service."""
    try:
        import google.auth
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
    except ImportError:
        sys.exit(
            "Missing dependencies. Run:\n"
            "  pip install google-auth google-auth-httplib2 google-api-python-client"
        )

    creds, _ = google.auth.default(scopes=SCOPES)
    if creds.expired and hasattr(creds, "refresh"):
        creds.refresh(Request())

    return build("gmail", "v1", credentials=creds)


# ---------------------------------------------------------------------------
# Email classification
# ---------------------------------------------------------------------------

# Sender domains / patterns that indicate job-board noise (skip these)
NOISE_SENDERS = {
    "info@glassdoor.com",
    "support@builtin.com",
    "talent@selbyjennings.com",  # newsletter
    "niko@nrscollective.com",
    "opportunities@careeralerts.wexinc.com",
    "inmail-hit-reply@linkedin.com",
    "noreply@jobright.ai",
}

# Keywords that classify an email as a particular status
STATUS_RULES = [
    # Offer
    ("offer", re.compile(
        r"\b(offer letter|we(?:'re| are) pleased to offer|"
        r"congratulations.*offer|job offer|offer of employment)\b",
        re.IGNORECASE,
    )),
    # Rejection
    ("rejected", re.compile(
        r"\b(not moving forward|decided not to move forward|"
        r"not selected|chosen not to proceed|"
        r"regret to inform|unfortunately|"
        r"we will not be|won't be moving|"
        r"other candidates|not a match)\b",
        re.IGNORECASE,
    )),
    # Interview scheduled / confirmed
    ("interview_scheduled", re.compile(
        r"\b(interview (?:confirmation|confirmed|scheduled|reminder)|"
        r"your (?:upcoming )?interview|"
        r"coderpad interview|hiring manager (?:screen|interview)|"
        r"technical (?:screen|interview))\b",
        re.IGNORECASE,
    )),
    # Interview invite / request
    ("interviewing", re.compile(
        r"\b(invitation.*interview|interview.*invitation|"
        r"we(?:'d| would) like to (?:schedule|invite)|"
        r"schedule.*interview|interview.*schedule|"
        r"availability for.*interview)\b",
        re.IGNORECASE,
    )),
    # Applied / received confirmation
    ("applied", re.compile(
        r"\b(thank you for (?:your application|applying)|"
        r"we(?:'ve| have) received your application|"
        r"application (?:received|submitted|confirmed)|"
        r"received your (?:resume|cv|application))\b",
        re.IGNORECASE,
    )),
]

# Priority order for status resolution (higher index = higher priority)
STATUS_PRIORITY = {
    "applied": 0,
    "interviewing": 1,
    "interview_scheduled": 2,
    "rejected": 3,
    "offer": 4,
}


def classify_email(subject: str, snippet: str) -> str | None:
    """Return the best status label for an email, or None if unclassifiable."""
    text = f"{subject} {snippet}"
    for status, pattern in STATUS_RULES:
        if pattern.search(text):
            return status
    return None


# ---------------------------------------------------------------------------
# Company / role extraction
# ---------------------------------------------------------------------------

COMPANY_PATTERNS = [
    # "your application to <Company>"
    re.compile(r"application to (.+?)(?:\s*[!\|,\.]|$)", re.IGNORECASE),
    # "Thank you for applying to <Company>"
    re.compile(r"applying to (.+?)(?:\s*[!\|,\.]|$)", re.IGNORECASE),
    # "<Company> Interview"
    re.compile(r"^(.+?)\s+(?:interview|coderpad)", re.IGNORECASE),
    # "Interview with <Company>"
    re.compile(r"interview with (.+?)(?:\s*[!\|,\|]|$)", re.IGNORECASE),
    # "Interview - <Company>"
    re.compile(r"interview\s*[-–]\s*(.+?)(?:\s*[!\|,\.]|$)", re.IGNORECASE),
    # "<Company> Careers:"
    re.compile(r"^(.+?) careers:", re.IGNORECASE),
    # "Thank you for your application! <Company>" (sender domain)
]

ROLE_PATTERNS = [
    # "for the <Role> position"
    re.compile(r"for (?:the )?(.+?) (?:position|role|job|opening)\b", re.IGNORECASE),
    # "application for <Role>"
    re.compile(r"application for (.+?)(?:\s*[!\|,\.]|$)", re.IGNORECASE),
    # Subject line: "Thank you for your application for <Role>"
    re.compile(r"your application for (.+?)(?:\s*[!\|,\.]|$)", re.IGNORECASE),
]

KNOWN_COMPANIES = {
    # sender domain fragment -> company name
    "microsoft": "Microsoft",
    "akamai": "Akamai Technologies",
    "oracle": "Oracle",
    "tesla": "Tesla",
    "uber": "Uber",
    "bloomberg": "Bloomberg",
    "asana": "Asana",
    "mastercard": "Mastercard",
    "chewy": "Chewy",
    "whoop": "WHOOP",
    "goldman": "Goldman Sachs",
    "gs.com": "Goldman Sachs",
    "walleye": "Walleye Capital",
    "capsule": "Capsule",
    "kepler": "Kepler",
    "salient": "Salient AI",
    "zscaler": "Zscaler",
    "chartahealth": "Charta Health",
    "neonhealth": "Neon Health",
    "github": "GitHub",
    "ascendhire": "Ascend Hire",
}


def extract_company_from_sender(sender: str) -> str | None:
    sender_lower = sender.lower()
    for fragment, name in KNOWN_COMPANIES.items():
        if fragment in sender_lower:
            return name
    return None


def extract_company_from_subject(subject: str) -> str | None:
    for pattern in COMPANY_PATTERNS:
        m = pattern.search(subject)
        if m:
            candidate = m.group(1).strip().rstrip("!.,|")
            # reject long strings (probably the whole subject matched)
            if len(candidate) < 60:
                return candidate
    return None


def extract_role_from_text(subject: str, snippet: str) -> str | None:
    text = f"{subject} {snippet}"
    for pattern in ROLE_PATTERNS:
        m = pattern.search(text)
        if m:
            role = m.group(1).strip().rstrip("!.,|")
            if 3 < len(role) < 80:
                return role
    return None


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def fetch_threads(service, query: str, max_results: int = 200) -> list[dict]:
    """Fetch all threads matching query, handling pagination."""
    threads = []
    request = service.users().threads().list(
        userId="me", q=query, maxResults=min(max_results, 50)
    )
    while request and len(threads) < max_results:
        response = request.execute()
        batch = response.get("threads", [])
        threads.extend(batch)
        request = service.users().threads().list_next(request, response)
    return threads


def get_thread_messages(service, thread_id: str) -> list[dict]:
    """Return minimal message metadata for a thread."""
    thread = service.users().threads().get(
        userId="me", threadId=thread_id, format="metadata",
        metadataHeaders=["Subject", "From", "To", "Date"],
    ).execute()
    return thread.get("messages", [])


def parse_header(headers: list[dict], name: str) -> str:
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


def parse_date(date_str: str) -> str:
    """Parse RFC 2822 date and return ISO 8601 string."""
    from email.utils import parsedate_to_datetime
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return date_str


def process_threads(service, threads: list[dict]) -> dict[str, dict]:
    """
    Build a dict keyed by (company, role) with the best-known status.
    Returns: { "Company | Role": { ...record... } }
    """
    applications: dict[str, dict] = {}

    for thread_meta in threads:
        thread_id = thread_meta["id"]
        try:
            messages = get_thread_messages(service, thread_id)
        except Exception as e:
            print(f"  Warning: could not fetch thread {thread_id}: {e}", file=sys.stderr)
            continue

        for msg in messages:
            headers = msg.get("payload", {}).get("headers", [])
            subject = parse_header(headers, "Subject")
            sender = parse_header(headers, "From")
            date_str = parse_header(headers, "Date")
            snippet = msg.get("snippet", "")

            # Skip noise senders
            sender_email = re.search(r"<(.+?)>", sender)
            sender_email = sender_email.group(1).lower() if sender_email else sender.lower()
            if sender_email in NOISE_SENDERS:
                continue

            status = classify_email(subject, snippet)
            if status is None:
                continue

            # Extract company
            company = (
                extract_company_from_sender(sender)
                or extract_company_from_subject(subject)
                or "Unknown"
            )

            # Extract role
            role = extract_role_from_text(subject, snippet) or "Software Engineer"

            # Build key: prefer exact company name match to deduplicate
            key = f"{company} | {role}"

            iso_date = parse_date(date_str) if date_str else ""

            if key not in applications:
                applications[key] = {
                    "company": company,
                    "role": role,
                    "status": status,
                    "applied_date": iso_date if status == "applied" else "",
                    "last_update": iso_date,
                    "thread_id": thread_id,
                    "emails": [],
                }

            record = applications[key]

            # Upgrade status if new event is higher priority
            current_priority = STATUS_PRIORITY.get(record["status"], -1)
            new_priority = STATUS_PRIORITY.get(status, -1)
            if new_priority > current_priority:
                record["status"] = status

            if status == "applied" and not record["applied_date"]:
                record["applied_date"] = iso_date

            # Keep latest update date
            if iso_date > record["last_update"]:
                record["last_update"] = iso_date

            # Append email summary
            record["emails"].append({
                "message_id": msg.get("id"),
                "date": iso_date,
                "subject": subject,
                "sender": sender,
                "status_signal": status,
            })

    return applications


def build_output(applications: dict[str, dict]) -> dict:
    """Structure the final JSON output."""
    entries = sorted(
        applications.values(),
        key=lambda r: r["last_update"],
        reverse=True,
    )

    # Summarise counts
    summary: dict[str, int] = {}
    for entry in entries:
        summary[entry["status"]] = summary.get(entry["status"], 0) + 1

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": summary,
        "total": len(entries),
        "applications": entries,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync job applications from Gmail to JSON.")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="Output JSON path")
    parser.add_argument("--days", type=int, default=180, help="Look back this many days (default: 180)")
    args = parser.parse_args()

    print("Authenticating with Gmail…")
    service = get_gmail_service()

    query = (
        f"newer_than:{args.days}d "
        "(subject:(\"thank you for your application\" OR \"thank you for applying\" OR "
        "\"we received your application\" OR \"interview\" OR \"offer letter\" OR "
        "\"not moving forward\" OR \"rejection\" OR \"congratulations\") "
        "OR from:(myworkday.com OR greenhouse.io OR lever.co OR ashbyhq.com OR "
        "icims.com OR taleo.net OR workday.com OR smartrecruiters.com OR "
        "careers.microsoft.com OR modernloop.io))"
    )

    print(f"Fetching email threads from the last {args.days} days…")
    threads = fetch_threads(service, query, max_results=500)
    print(f"Found {len(threads)} matching threads. Processing…")

    applications = process_threads(service, threads)

    output = build_output(applications)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))

    print(f"\nWrote {output['total']} applications to {out_path}")
    print("Summary:")
    for status, count in sorted(output["summary"].items()):
        print(f"  {status:25s} {count}")


if __name__ == "__main__":
    main()
