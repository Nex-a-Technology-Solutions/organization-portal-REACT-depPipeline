Frontend Deployment Pipeline Guidelines

This repository is integrated with Vercel for automated deployments of the React frontend application.

🚀 Deployment Overview

Hosting: Vercel (Production environment).

CI/CD: All commits to the main branch trigger an automatic build and deployment to production.

Preview Deployments: Pull requests automatically generate preview builds for testing before merging.

⚠️ Important Rules

Do not push unreviewed code to the main branch.

All code changes must go through a pull request.

PRs require review and approval before merging.

Ensure all updates are:

Tested locally (npm run build and npm start).

Checked for UI/UX consistency.

Compatible with backend API changes.

Avoid committing secrets, API keys, or sensitive configuration files.

Use Vercel’s Environment Variables feature.

🛠 Deployment Workflow

Local Development:

Create a new branch for your feature or bug fix.

Run locally using:
