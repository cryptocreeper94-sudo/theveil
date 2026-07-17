FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install ALL dependencies (need devDeps for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build (uses tsx from devDependencies)
RUN npm run build

# Prune dev dependencies
RUN npm prune --omit=dev

# Runtime
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/index.cjs"]
