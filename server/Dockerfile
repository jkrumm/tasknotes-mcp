FROM oven/bun:1.3.9-slim AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.9-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG COMMIT_SHA=dev
ENV COMMIT_SHA=$COMMIT_SHA
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY server.ts tsconfig.json package.json ./
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
