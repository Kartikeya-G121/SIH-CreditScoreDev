# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json ./
RUN npm install --frozen-lockfile

# ---- Builder ----
FROM deps AS builder
COPY . .
# The build script in package.json is `NODE_ENV=production next build`
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The Next.js app starts on port 3000 by default.
EXPOSE 3000

ENV PORT 3000

# The `next start` command is now `node server.js` in the standalone output
CMD ["node", "server.js"]
