# DecentraliTrack

DecentraliTrack is a blockchain-assisted public infrastructure tracking platform. This project contains the React frontend, Express backend, shared workspace packages, and Solidity contracts copied from the DecentraliTrack source project.

## Layout

```text
.
├── frontend                 # Vite + React frontend
├── Backend                  # Express API + WebSocket server
├── lib/api-client-react     # Generated API client for the frontend
├── lib/api-zod              # Generated API types/schemas
├── lib/db                   # Drizzle/Postgres package
├── lib/api-spec             # OpenAPI source + generation config
├── contracts                # Solidity contracts and Hardhat config
└── scripts                  # Root dev launcher
```

## Start Everything

Install dependencies once:

```bash
pnpm install
```

Start both frontend and backend from the project root:

```bash
pnpm dev
```

The launcher starts both services and auto-picks free ports when defaults are occupied.

Default local URLs:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3001`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm --filter ./frontend run dev
pnpm --filter ./Backend run dev
```

## Environment

The app can run in demo mode without a database or deployed contracts. For normal local development, create a root `.env`:

```env
DATABASE_URL=postgresql://dt_user:dt_pass123@localhost:5432/decentralitrack
SESSION_SECRET=change-this-to-a-random-secret
```

Optional port overrides:

```env
FRONTEND_PORT=5173
API_PORT=3001
```
