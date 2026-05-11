# syntax=docker/dockerfile:1
FROM node:22-alpine AS runtime

ARG APP_VERSION=production
ARG COMMIT_SHA=unknown

ENV NODE_ENV=production \
    APP_VERSION=$APP_VERSION \
    COMMIT_SHA=$COMMIT_SHA
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY src ./src

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
