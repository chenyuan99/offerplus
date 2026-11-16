# jobgpt Specification

## Purpose
JobGPT is the AI writing assistant for job seekers. It turns user input into a prompt using a
mode-specific template, sends it to an OpenAI chat model, and returns the generated answer with
metadata. It can also use an uploaded resume as extra context.

## Requirements
### Requirement: Mode-specific prompt templates
The system SHALL support the modes `why_company`, `behavioral` and `general`, and SHALL build
the prompt from a template for the selected mode. `why_company` SHALL use the
`company-research-interest` template; the other modes SHALL use their mode's default template.
Templates SHALL be loaded from the bundled prompt data into an in-memory cache.

#### Scenario: Behavioral question
- **WHEN** a user submits a question in `behavioral` mode
- **THEN** the prompt is built from the default behavioral template combined with the user's question

#### Scenario: Template for another mode
- **WHEN** a template id is requested for a mode it does not belong to
- **THEN** a prompt error is raised instead of using the mismatched template

### Requirement: Why-company input parsing
In `why_company` mode, when the input contains both `Company:` and `About me:` lines, the
system SHALL use the company line as the company name context and the `About me:` text as the
user input.

#### Scenario: Structured why-company input
- **WHEN** the input is `Company: Stripe\nAbout me: Backend engineer with payments experience`
- **THEN** the prompt uses "Stripe" as the company name and the background text as the user input

### Requirement: Input validation
The system SHALL reject input that is empty or longer than 5,000 characters, and SHALL apply
mode minimums: at least 3 characters for `why_company`, 10 for `behavioral` and 5 for
`general`. Rejected input SHALL NOT be sent to the AI model.

#### Scenario: Input too short
- **WHEN** a user submits "Why?" in `behavioral` mode
- **THEN** the request fails with an "Invalid input" error and no API call is made

### Requirement: AI model requests
The system SHALL send formatted prompts to the OpenAI Chat Completions API using the selected
model (`gpt-5-mini`, `gpt-3.5-turbo`, `gpt-4` or `gpt-4-turbo`).

#### Scenario: Successful response
- **WHEN** the model returns an answer
- **THEN** the response includes the generated text, mode, model, template id, processing time, the system and user prompts, and token usage when available

### Requirement: User-facing error messages
The system SHALL translate AI service failures into user-facing messages: authentication
failures, rate limits, network errors and timeouts SHALL each produce a specific message, and
other failures SHALL produce a "Failed to generate response" message.

#### Scenario: Rate limit
- **WHEN** the AI service responds with a rate-limit error
- **THEN** the user sees "Rate limit exceeded. Please try again in a moment."

### Requirement: Resume context
The system SHALL let a signed-in user upload a resume to the `resumes` storage bucket under a
path prefixed with their user id, then call the `process-resume` Edge Function to extract and
store its text for use as JobGPT context.

#### Scenario: Upload while signed out
- **WHEN** a user who is not signed in tries to upload a resume
- **THEN** the upload fails with "Please log in to upload a resume"
