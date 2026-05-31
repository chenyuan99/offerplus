---
name: offerplus-gmail-sync
description: Sync job application statuses from Gmail into OfferPlus. Use when the user says "sync my job status", "update offerplus from gmail", or "check my email for job updates". Requires a Gmail MCP connection and an OfferPlus API token.
metadata:
  author: chenyuan99
  version: "1.0.0"
---

# OfferPlus Gmail Sync

Reads Gmail for job application status signals (interviews, rejections, OAs, offers) and writes them into OfferPlus via the Agent API. Existing applications are updated in-place; emails with no matching DB record are created as new entries.

## Input

The user must supply an OfferPlus API token (starts with `op_`). If not provided in the invocation, ask:

> "Please paste your OfferPlus API token (from Profile → Agent API Keys)."

The base URL is always:
```
https://lwexhbimtxpndhsidogl.supabase.co/functions/v1/agent-api
```

## Step 1 — Fetch current applications

```bash
curl -s "$BASE/applications?limit=300" \
  -H "Authorization: Bearer $TOKEN"
```

Save the result. Build an in-memory lookup: `company_name.toLowerCase() → {id, status}`. Also index individual words (>3 chars) from the company name so fuzzy matching works.

## Step 2 — Search Gmail for status signals

Run all four searches **in parallel** using the Gmail MCP `search_threads` tool. Use `newer_than:90d` (adjust if the user specifies a different window).

| Signal type | Gmail query |
|---|---|
| Interview invites | `(interview OR "phone screen" OR "schedule time" OR "next steps") newer_than:90d -in:sent` |
| Rejections | `("not moving forward" OR "decided to move forward with other" OR "unfortunately" OR "not selected" OR "chosen to pursue") newer_than:90d -in:sent` |
| Online assessments | `("online assessment" OR "coding challenge" OR hackerrank OR codesignal OR codility OR "take-home assignment") newer_than:90d -in:sent` |
| Offers | `("offer letter" OR "pleased to offer" OR "job offer" OR "total compensation" OR "start date") newer_than:90d -in:sent` |

Also run a broad ATS catch-all:
```
from:(greenhouse.io OR lever.co OR workday.com OR icims.com OR ashbyhq.com OR smartrecruiters.com OR jobvite.com OR ashby.com OR myworkday.com OR mail.amazon.jobs) newer_than:90d
```

Set `pageSize: 50` for each call.

## Step 3 — Classify each thread

For every thread snippet, extract:
- **Company name** — from subject, sender domain, or body
- **Signal type** — one of: `interview`, `oa`, `offer`, `rejected`, `applied` (confirmation only — skip these)
- **Job title** — if visible in subject or body

**Skip** application confirmation emails (subject contains "thank you for applying", "we received your application", "application submitted") — these add noise without new status information.

**Fetch full body** (`get_thread` with `FULL_CONTENT`) only when the snippet is ambiguous — e.g., it ends mid-sentence before the key decision word.

### Status mapping rules

| Email signal | OfferPlus status |
|---|---|
| Interview invitation / calendar invite / "schedule time" | `interview` |
| OA / coding challenge / assessment link | `oa` |
| "not moving forward" / "other candidates" / "not selected" | `rejected` |
| Offer letter / compensation package | `offer` |
| Accepted offer / start date confirmed | `accepted` |

## Step 4 — Match to DB and compute diff

For each classified email:

1. **Exact match**: look up `company_name.toLowerCase()` in the index.
2. **Fuzzy match**: check if any word from the email company name (>3 chars) appears in an existing record's name or `company_link`/`job_link`.
3. **No match**: the application is not yet in OfferPlus → will be created.

**Skip** any match where the DB record already has the correct status (no-op).

**Skip** any match where the DB status represents a *later* stage than the email signal — don't downgrade. Order: `applied < oa < interview < offer < accepted`. Never overwrite `rejected` with `applied`.

## Step 5 — Apply updates

### Update existing records (PATCH)

```bash
curl -s -X PATCH "$BASE/applications/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "interview", "notes": "Interview invite via Greenhouse — May 28"}'
```

Always set `notes` to a short description of the email signal and date.

### Create new records (POST)

For emails with no matching DB record:

```bash
curl -s -X POST "$BASE/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Corp",
    "job_title": "Software Engineer",
    "status": "interview",
    "date_applied": "2026-05-20",
    "notes": "Interview scheduled May 28 — sourced from Gmail"
  }'
```

Use the email date as `date_applied` if the actual application date is unknown.

## Step 6 — Report results

Print a concise summary table:

```
Synced N changes from Gmail (last 90 days)

UPDATED (existing records)
  [id] Company — old_status → new_status  (signal: ...)

ADDED (new records)
  [id] Company — status  (signal: ...)

SKIPPED
  Company — already at correct status / confirmation only / no match
```

If nothing changed, say so explicitly rather than printing an empty table.

## Error handling

- If the token is invalid (401), stop immediately and ask the user to check their API key in Profile → Agent API Keys.
- If Gmail returns no threads for all queries, widen the time window to `newer_than:180d` and retry once.
- If a company matches multiple DB records (duplicate applications), update the most recent one only.
- Never update `user_id`, `company_link`, or `job_link` via this skill — only `status` and `notes`.
