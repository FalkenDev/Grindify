<p align="center">
  <!-- <img src="frontend/src/assets/logo.svg" width="120" alt="Grindify Logo" /> -->
</p>

<h1 align="center">Grindify</h1>

  <p align="center">A self-hosted fitness tracking web application built with NestJS and Vue 3.</p>
    <p align="center">
<a href="LICENSE" target="_blank"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License" /></a>
<a href="https://nestjs.com/" target="_blank"><img src="https://img.shields.io/badge/backend-NestJS-E0234E.svg" alt="Backend" /></a>
<a href="https://vuejs.org/" target="_blank"><img src="https://img.shields.io/badge/frontend-Vue.js-4FC08D.svg" alt="Frontend" /></a>
<a href="https://www.postgresql.org/" target="_blank"><img src="https://img.shields.io/badge/database-PostgreSQL-336791.svg" alt="Database" /></a>
</p>

---

## Overview

Grindify is a full-stack workout application designed for users who want full ownership of their data without subscription fees or connectivity requirements. It offers a complete suite of tools to plan routines, log sessions in real-time, and visualize progress over time. The platform is designed to be mobile-first for gym usage while providing a robust desktop interface for planning and analysis.

**Try it:** [app.grindify.io](https://app.grindify.io) · **Website:** [grindify.io](https://grindify.io) · **Status:** active

## Features

- **Workout Management**: Create and organize custom workout routines with specific exercises, sets, and targets.
- **Session Tracking**: Log workouts in real-time with an interface optimized for mobile devices.
- **Exercise Library**: Manage a database of exercises with support for custom images and muscle group categorization.
- **Progress Analytics**: View detailed statistics including volume, frequency, and personal records per exercise.
- **Body Metrics**: Track weight logs and upload progress photos to monitor physical changes.
- **Privacy Focused**: Complete data ownership with no third-party tracking or external dependencies.

## Technology Stack

### Backend

- **Framework**: NestJS (v11)
- **Database**: PostgreSQL 17
- **ORM**: TypeORM
- **Authentication**: Passport.js (JWT & Local Strategies)
- **Validation**: class-validator & class-transformer
- **Media**: Sharp (Image processing) & Multer (File uploads)
- **Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: Vuetify 3
- **State Management**: Pinia (with persistence)
- **Visualization**: Chart.js & Vue-Chartjs
- **Routing**: Vue Router

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (Recommended)
- OR
- **Node.js** v18+
- **PostgreSQL** v15+

### Installation (Docker - Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/FalkenDev/Grindify.git
   cd Grindify
   ```

2. **Start the application**

   ```bash
   docker compose up -d --build
   ```

   The database migrations will run automatically on startup.

3. **Seed initial data** (optional)
   Population of default exercises and muscle groups:

   ```bash
   docker exec -it grindify_backend npm run seed
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **API Documentation**: http://localhost:1337/api
   - **Backend API**: http://localhost:1337

### Installation (Manual)

1. **Clone the repository**

   ```bash
   git clone https://github.com/FalkenDev/Grindify.git
   cd Grindify
   ```

2. **Configure Environment**
   Copy the example environment file and configure your database credentials:

   ```bash
   cp .env.example .env
   ```

3. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Ensure PostgreSQL is running and update .env with credentials

   npm run build
   npm run start:prod
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run build
   npm run preview
   ```

## Development

### Project Structure

```
Grindify/
├── backend/          # NestJS API application
│   ├── src/          # Source code
│   └── test/         # E2E tests
├── frontend/         # Vue 3 application
│   └── src/          # Source code
├── docker-compose.yml # Development orchestration
└── Dockerfile.*      # Container definitions
```

### Running in Development Mode

To start both services with hot-reload enabled:

```bash
docker compose -f docker-compose.yml up
```

- Backend changes will trigger a transparent restart.
- Frontend changes will be reflected instantly via Vite HMR.

## Environment Variables

All configuration is done through environment variables. [`.env.example`](.env.example) lists every
variable with a short comment — copy it to `.env` and fill in your own values. Never commit `.env`.

| Group | Variables |
| --- | --- |
| Database | `POSTGRES_*`, `DATABASE_*` |
| Auth | `JWT_SECRET`, `AUTH_COOKIE_*`, `ALLOWED_ORIGINS`, `BACKEND_URL`, `FRONTEND_URL` |
| OAuth (optional) | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Email (optional) | `REQUIRE_EMAIL_VERIFICATION`, `RESEND_API_KEY`, `EMAIL_FROM` |
| Frontend build | `VITE_API_URL`, `VITE_CONTACT_EMAIL`, `VITE_OPERATOR_*`, `VITE_ALLOWED_HOSTS` |
| Releases proxy | `GITHUB_RELEASES_OWNER`, `GITHUB_RELEASES_REPO`, `GITHUB_RELEASES_TOKEN` |

## GitHub OAuth

Grindify supports optional GitHub sign-in. Leave `GITHUB_CLIENT_ID` blank to disable it entirely — the app works fine without it.

### Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: Grindify
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `http://localhost:1337/v1/auth/github/callback`
3. Copy the **Client ID** and generate a **Client Secret**
4. Add to your `.env`:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
BACKEND_URL=http://localhost:1337   # must match what GitHub redirects to
```

5. Restart the backend

If `GITHUB_CLIENT_ID` is not set, the GitHub button on the login page still appears but the strategy is not loaded — set it to enable the full flow.

**Account linking:** If a GitHub email matches an existing password-based account, the accounts are automatically linked. The user can then sign in with either method.

## Email Verification & Password Reset

Grindify supports optional email-based verification and password reset using [Resend](https://resend.com).

### Configuration

Set these variables in your `.env` file:

```env
# Enable email verification (false by default — users can log in immediately after registration)
REQUIRE_EMAIL_VERIFICATION=false

# Resend API key — required only when REQUIRE_EMAIL_VERIFICATION=true
RESEND_API_KEY=re_your_api_key_here

# The "From" address for outgoing emails
EMAIL_FROM=noreply@yourdomain.com

# The public URL of your frontend (used in email links)
FRONTEND_URL=https://yourdomain.com
```

### Setting up Resend

1. Create a free account at [resend.com](https://resend.com).
2. Go to **API Keys** and create a new key.
3. Add a verified sending domain under **Domains** (required to send from your own domain).
4. Set `RESEND_API_KEY` and `EMAIL_FROM` in your `.env`.
5. Set `REQUIRE_EMAIL_VERIFICATION=true` to enforce verification.

### How it works

| `REQUIRE_EMAIL_VERIFICATION` | Behaviour                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `false` (default)            | Users are auto-verified on registration. No email is sent. Password reset still works if Resend is configured.               |
| `true`                       | Users receive a 6-digit code by email after registration and must verify before logging in. Login is blocked until verified. |

**Password reset** (available regardless of the verification toggle):

1. User clicks "Forgot password?" on the login page.
2. They enter their email — a 6-digit reset code is sent.
3. They enter the code + new password on the reset page.
4. Codes expire after 15 minutes.

> **Note:** If `REQUIRE_EMAIL_VERIFICATION=false` and no Resend credentials are set, password reset emails will fail silently. Configure Resend if you want password reset to work.

## Version History

Grindify includes a Version History view in Settings. It compares:

- `installedVersion`: the build currently installed on the device or cached by the PWA
- `deployedVersion`: the version served by the live frontend at `/version.json`
- `latestReleaseVersion`: the latest official GitHub Release returned by the backend proxy

The frontend image bakes a `/version.json` file that includes:

- `version`
- `gitSha`
- `builtAt`
- `channel`

Status interpretation:

- `installedVersion == deployedVersion`: this device is current for the deployed server build
- `installedVersion < deployedVersion`: this device still has an older cached PWA build and should update
- `deployedVersion < latestReleaseVersion`: a newer official release exists but the server has not deployed it yet
- `installedVersion > latestReleaseVersion`: the device is on a development or pre-release build; this is shown as a neutral mismatch

### GitHub Releases proxy

The backend exposes release history through `GET /v1/releases`. By default it resolves to the `FalkenDev/Grindify` repository unless you override these variables:

```env
GITHUB_RELEASES_OWNER=FalkenDev
GITHUB_RELEASES_REPO=Grindify
GITHUB_RELEASES_TOKEN=
```

Use `GITHUB_RELEASES_TOKEN` if you want higher GitHub API limits for self-hosted deployments.

### Maintainer note

The tag/release/deploy workflow is maintainer-specific and is documented alongside the Grindify stack in the Homelab repository. Contributors and normal self-hosted users do not need to create GitHub Releases to run Grindify locally.

## Deployment

GitHub Actions (`.github/workflows/build.yml`) builds multi-arch images on every push to `main`
and on tags, and pushes them to GHCR:

- `ghcr.io/falkendev/grindify-api`
- `ghcr.io/falkendev/grindify-frontend`
- `ghcr.io/falkendev/grindify-adminpanel`

To self-host, either run these images or build the same Dockerfiles with
[`docker-compose.prod.yml`](docker-compose.prod.yml) (`docker compose -f docker-compose.prod.yml up -d --build`).

The official instance ([app.grindify.io](https://app.grindify.io), admin at `admin.grindify.io`) runs these
images on the maintainer's homelab. Health check: `GET /api/v1/auth/health`; deployed version: `/version.json`.

## Contributing

Contributions are welcome. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

By contributing to Grindify, you agree to our [Contributor License Agreement (CLA)](CLA.md).

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.

This software is provided "as is", without warranty of any kind.
