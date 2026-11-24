# OnTask — AI-Assisted Project Execution

OnTask is a project-execution application exploring AI-assisted planning, task organization, team assignment, progress tracking, analytics, and risk/recommendation workflows.

## Project overview

The repository contains a Python application layer, a separate backend service, and a React frontend. The exact capabilities available depend on the current implementation and local service configuration; review the code and project analysis notes before treating a feature as production-ready.

## Repository layout

- `app.py` and supporting Python modules — application entry point and workflow/analytics helpers.
- `backend/` — backend service and API implementation.
- `frontend/` — React/Vite client.
- `docs/` and `PROJECT_ANALYSIS.md` — project notes and setup/analysis documentation.
- `scripts/` — helper scripts.

## Technology areas

- Python application logic and Flask-based service components.
- React, JavaScript and Vite frontend.
- Firebase client authentication integration.
- Workflow planning, task analytics and recommendation components.

## Local setup

### Frontend

1. Install Node.js compatible with the versions in `frontend/package.json`.
2. Create a local environment file:

   ```bash
   cd frontend
   cp .env.example .env
   ```

3. Replace the placeholder Firebase settings with configuration from your own Firebase project.
4. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

### Backend and Python components

Review the backend package manifest and `PROJECT_ANALYSIS.md` for the currently maintained backend setup. The root `requirements.txt` is not populated, so do not use it as a dependency installation source.

## Configuration and security

- Never commit local `.env` files, service-account JSON files, private keys, access tokens, or real user data.
- The committed `.env.example` contains placeholders only.
- Firebase web API keys are client configuration identifiers, not authorization controls. Enforce access through Firebase Security Rules and appropriate API restrictions.
- Runtime logs and uploaded user data should remain local or in a properly secured data store.

## Development hygiene

- Python virtual environments and bytecode caches are excluded from version control.
- Node dependencies and build output are excluded from version control.
- Generated logs and runtime CSV data are not source files and should not be committed.
- Before publishing screenshots or sample data, remove personal information.

## Current status

This is a development project. Validate all integrations, environment variables, security rules, and end-to-end workflows in a clean environment before deployment or production use.
