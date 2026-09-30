# Grindify

Free, self-hostable workout tracker (public app at https://app.grindify.io). Monorepo:
`backend/` NestJS 11 + TypeORM + PostgreSQL 17, `frontend/` Vue 3 + Vite + Vuetify 3 + Pinia
(PWA), `adminpanel/` Vue 3 + Vite + Tailwind (admin.grindify.io). AGPL-3.0.

## Commands
Run each inside its package directory.
- Everything in Docker: `docker compose up` (from repo root, hot reload)
- Backend: `npm run start:dev` · Build: `npm run build` · Lint: `npm run lint` · Tests: `npm test` / `npm run test:e2e`
- DB: `npm run migration:run` · `npm run migration:generate` · Seed: `npm run seed`
- Frontend: `npm run dev` · Build (includes type-check): `npm run build` · Type-check: `npm run type-check` · Tests: `npm test` · Lint: `npm run lint`
- Admin panel: `npm run dev` · Build (includes vue-tsc): `npm run build`

## Conventions
- API modules live in `backend/src/v1/<feature>/` (controller, service, entity, dto); routes are under `/v1`.
  In production Traefik serves the API at `app.grindify.io/api` and strips the prefix.
- Schema changes go through TypeORM migrations in `backend/src/v1/migrations/` — never `synchronize`.
- Frontend uses file-based routing (`frontend/src/pages/`), Pinia stores in `stores/`, API calls in `services/`,
  translations in `locales/`.
- `/version.json` is baked into the frontend image at build time; keep its shape (`version`, `gitSha`, `builtAt`, `channel`).
- Env vars: every new one goes into `.env.example` with a comment.

## Rules
- Never commit unless I ask. Never add Claude attribution to commits or PRs.
- Public repo: never commit secrets, real emails or server details.
- Production runs on the homelab (`projects/grindify` stack) and is deployed by pinned version only —
  follow `stacks/projects/grindify/RELEASE.md` in the Homelab repo and the `homelab` skill.
