# Contributing to Offers+

Thanks for helping improve Offers+. These instructions cover the main areas of the repository; some features have additional setup requirements described in their local README files.

## Before you start

- Check existing issues and pull requests for related work.
- For a substantial change, open an issue first to discuss the approach.
- Keep each pull request focused and describe user-visible changes, relevant risks, and how you verified them.
- Never commit credentials, access tokens, private user data, or local environment files. Use the applicable `.env.example` file where available.

## Get the code

```sh
git clone https://github.com/chenyuan99/offerplus.git
cd offerplus
git checkout -b your-change
```

Install dependencies only for the area you are changing. The frontend uses Node.js (see `frontend/.nvmrc`) and npm. Python tools are described by the root and `h1b/requirements.txt` files. Supabase Edge Functions use Deno; see their local configuration and workflow files.

## Work on the frontend

```sh
cd frontend
npm ci
npm run dev
```

Before submitting frontend changes, run the relevant checks:

```sh
npm test -- --run
npm run test:css
npm run build
npm run lint
```

The CSS test checks that Tailwind utilities compile through the configured PostCSS pipeline. The build also generates the sitemap. If a check fails, include the failure and its context in the pull request.

## Work on Python code

Create and activate a virtual environment, then install the requirements for the code you are changing. For the root project:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Run the relevant Python tests with `pytest`. H1B-specific dependencies are listed in `h1b/requirements.txt`; install them when working in that area.

## Work on Supabase Edge Functions

Edge Functions and database migrations live under `supabase/`. Keep database changes in migrations and include tests or a clear verification procedure for behavior changes. Use the repository's Deno configuration and function workflow; do not run changes against production data during local development.

## Pull requests

1. Rebase or merge the current `develop` branch before requesting review, and resolve conflicts locally.
2. Keep changes scoped and use a clear title, such as `fix: handle expired sessions` or `chore(deps): update package`.
3. Explain what changed, why it changed, and the commands or manual steps used to verify it.
4. Link related issues and add screenshots for visual changes when useful.
5. Confirm generated files are intentional and remove local build output or unrelated edits.
6. Respond to review feedback and ensure required CI checks pass before merging.

## Style and safety

- Follow the conventions already used in the touched directory.
- Prefer small, readable changes with useful error handling.
- Protect user data and keep authorization checks on the server/database boundary.
- Do not commit dependency or generated-file changes unrelated to your contribution.
