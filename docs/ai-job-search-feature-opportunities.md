# Feature Opportunities from MadsLorentzen/ai-job-search

Source: [github.com/MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) — an open-source, Claude-Code-based local framework that evaluates job postings, tailors CVs/cover letters, and preps candidates for interviews.

This doc maps its functionality against what OfferPlus has today and calls out the gaps worth closing.

## Where OfferPlus stands today

- **Application tracking**: solid CRUD (`backend/openapi.yaml`, `frontend/src/pages/Dashboard.tsx`, `AddApplication.tsx`, `EditApplication.tsx`) with basic statuses (`APPLIED, OA, VO, OFFER, REJECTED`).
- **Resume handling**: pure file storage in Supabase (`frontend/src/components/Resume.tsx`) — upload only, no parsing or content use.
- **AI usage**: one generic GPT call (`frontend/src/lib/aiModelAdapters.ts` → `OpenAIAdapter`) behind three canned prompts in `JobGPT.tsx` (why_company, behavioral, general). No resume or job-description context is injected.
- **Job discovery**: none — no scraper, no portal integrations; `docs/Import-From-Simplify.md` only covers manual import from Simplify.jobs.
- **ATS check**: an external link to a third-party Streamlit app, not integrated.
- **Referenced but unbuilt**: `jobgpt-prompt`, `process-resume`, `match-resume`, and `sync-gmail` Supabase Edge Functions are called from the frontend but don't exist in `supabase/functions/` — these are exactly the seams where ai-job-search's functionality would slot in.

## High-value functionality to bring over

### 1. Fit evaluation (job ↔ profile scoring)
ai-job-search scores each posting against the candidate profile on skills, experience, culture, location, and trajectory before any application work starts. OfferPlus has no equivalent — applications are logged with no signal on whether they're worth pursuing. This could implement the currently-stubbed `match-resume` function and add a fit score column to the application list/dashboard.

### 2. Resume-aware, context-injected generation
Today's `OpenAIAdapter` calls are prompt-only with no resume or JD text attached. ai-job-search's tailoring step parses the candidate's actual resume/profile and the target posting into the prompt. Wiring the dormant `process-resume` function to extract resume text and pass it (plus the job description) into `promptManager.ts` would turn `JobGPT.tsx` from generic Q&A into real tailored output — directly reusing existing UI.

### 3. Drafter–reviewer generation loop
Cover letters/answers in ai-job-search go through a second, independent agent pass (research + critique) before being finalized. OfferPlus's single-shot GPT call has no review step. A second adapter call in `jobgptService.ts` that critiques the first output before returning it would meaningfully raise output quality without new infrastructure.

### 4. Interview prep pack
ai-job-search generates stage-specific prep using STAR methodology, keyed to the specific posting. OfferPlus has no interview-prep feature at all — this would be a net-new prompt mode in `JobGPT.tsx`/`promptManager.ts`, alongside the existing `behavioral`/`why_company`/`general` modes.

### 5. Application outcome calibration
ai-job-search records outcomes and feeds them back to improve future fit scoring. OfferPlus already stores status per application (`APPLIED`, `REJECTED`, `OFFER`, etc.) but never uses that history for anything. Once fit scoring (item 1) exists, outcome data already in the applications table could calibrate it — no new schema needed.

### 6. Skill-gap analysis (`/upskill` equivalent)
Given a set of tracked postings, ai-job-search identifies recurring skill gaps and prioritizes learning resources. This is new territory for OfferPlus, but is a natural extension once fit scoring (item 1) is producing skill-level diffs rather than a single number.

## Lower priority / poor fit

- **LaTeX CV compilation + PDF verification loop**: ai-job-search's CV tailoring assumes a local LaTeX toolchain and PDF rendering loop, which fits a CLI-first, single-user tool. OfferPlus is a hosted multi-user web app — a server-side LaTeX/PDF pipeline is a heavier lift than the value justifies right now given resumes are just uploaded files today, not generated documents.
- **Portal-specific scrapers (Jobindex, Jobnet, LinkedIn, freehire)**: these are Danish/EU market-specific and would need a from-scratch, US-market equivalent. Worth doing only if job discovery (vs. tracking-only) becomes a stated product goal.

## Suggested sequencing

1. Implement `process-resume` (extract resume text) — unblocks everything else.
2. Implement `match-resume` as the fit-evaluation function, surfaced on the dashboard.
3. Add the reviewer pass to existing `jobgptService.ts` calls.
4. Add an interview-prep prompt mode.
5. Revisit scraping/skill-gap analysis once 1–4 are live and outcome data has accumulated.
