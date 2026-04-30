# Target linux/amd64 explicitly — matches Railway's servers and avoids the
# pnpm-workspace.yaml overrides that block linux-arm64 native binaries.
FROM --platform=linux/amd64 node:22-slim AS deps

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy workspace manifests first so this layer is cached unless deps change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json         ./frontend/
COPY Backend/package.json          ./Backend/
COPY contracts/package.json        ./contracts/
COPY scripts/package.json          ./scripts/
COPY lib/api-spec/package.json     ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json      ./lib/api-zod/
COPY lib/db/package.json           ./lib/db/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM --platform=linux/amd64 node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy the entire deps stage (node_modules with pnpm symlinks intact)
COPY --from=deps /app ./

# Overlay with full source code
COPY . .

# Build: typecheck → frontend (Vite) → backend (esbuild)
RUN pnpm run build

# ─── Stage 3: Production runtime ──────────────────────────────────────────────
FROM --platform=linux/amd64 node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only the compiled artefacts — esbuild bundles all JS deps so no node_modules needed
COPY --from=builder /app/Backend/dist           ./Backend/dist
COPY --from=builder /app/frontend/dist/public   ./frontend/dist/public

# Railway injects PORT automatically; default to 3000 for local docker runs
EXPOSE 3000

CMD ["node", "--enable-source-maps", "./Backend/dist/index.mjs"]
