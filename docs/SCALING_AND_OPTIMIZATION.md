# Scaling & Optimization Guide

This document covers strategies for scaling and optimizing the CDA Dubai Communicates application.

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Docker Build Optimization](#docker-build-optimization)
3. [Migrating to Bun in Docker](#migrating-to-bun-in-docker)
4. [Database Optimization](#database-optimization)
5. [Application-Level Caching](#application-level-caching)
6. [Horizontal Scaling](#horizontal-scaling)
7. [Monitoring & Observability](#monitoring--observability)

---

## Current Architecture Overview

### Stack
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Next.js 15.5 (Standalone output)
- **Database**: PostgreSQL 16
- **Container**: Docker with multi-stage builds
- **Email**: SendGrid API

### Current Configuration
| Component | Setting | Notes |
|-----------|---------|-------|
| DB Connection Pool | Max 20 connections | Configured in `lib/db.ts` |
| Idle Timeout | 30 seconds | |
| Connection Timeout | 2 seconds | |
| Rate Limiting | Database-based | `rate_limits` table |

---

## Docker Build Optimization

### Current Dockerfile Analysis

The current Dockerfile uses multi-stage builds which is good practice. Here are additional optimizations:

### 1. Optimize Layer Caching

**Current Issue**: Dependencies are reinstalled on every code change.

**Optimization**: Copy package files first, install dependencies, then copy source:

```dockerfile
# Stage: deps
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files first (cached if unchanged)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage: builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
```

### 2. Use BuildKit Cache Mounts

Enable BuildKit for faster builds with cache mounts:

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# Use cache mount for npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production
```

**Enable BuildKit**:
```bash
export DOCKER_BUILDKIT=1
docker build -t cda-app .
```

### 3. Reduce Image Size

```dockerfile
# Use slim base for production
FROM node:20-alpine AS runner

# Remove unnecessary files
RUN rm -rf /var/cache/apk/* /tmp/*

# Don't run as root
USER nextjs
```

### 4. Multi-Platform Builds

For deployment to different architectures:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t cda-app .
```

---

## Migrating to Bun in Docker

### Why Bun?

| Feature | npm | Bun |
|---------|-----|-----|
| Install Speed | ~30s | ~5s |
| Lock File Size | Large | Smaller |
| Native TypeScript | No | Yes |
| Bundle Size | Standard | Smaller |

### Bun Dockerfile

Replace the current Node.js Dockerfile with Bun:

```dockerfile
# ============================================
# Bun-based Dockerfile for CDA Application
# ============================================

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 3: Production Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
```

### Migration Steps

1. **Generate bun.lockb**:
   ```bash
   # In local development
   bun install
   # This creates bun.lockb from package.json
   ```

2. **Update package.json scripts** (optional, for local dev):
   ```json
   {
     "scripts": {
       "dev": "bun --bun next dev",
       "build": "bun --bun next build",
       "start": "bun --bun next start"
     }
   }
   ```

3. **Update docker-compose.yml**:
   ```yaml
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile.bun  # Or update main Dockerfile
   ```

### Bun Compatibility Notes

- **pg library**: Works with Bun natively
- **Next.js 15**: Fully compatible
- **SendGrid**: Works without changes
- **next-intl**: Compatible

---

## Database Optimization

### 1. Connection Pooling Optimization

**Current**: 20 max connections in application pool.

**Recommendation**: Use PgBouncer for connection pooling at infrastructure level.

```yaml
# docker-compose.yml addition
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://cda_user:cda_password@db:5432/cda_db
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
      MIN_POOL_SIZE: 5
    ports:
      - "6432:6432"
    depends_on:
      - db
```

**Update application connection**:
```typescript
// lib/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Point to PgBouncer
  max: 5,  // Reduce app-level pooling when using PgBouncer
  idleTimeoutMillis: 30000,
})
```

### 2. Query Optimization

**Add Query Logging in Development**:
```typescript
// lib/db.ts - already implemented
export async function query<T>(text: string, params?: unknown[]) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start

  // Log slow queries
  if (duration > 100) {
    console.warn(`Slow query (${duration}ms):`, text)
  }

  return result
}
```

**Identify Slow Queries**:
```sql
-- Enable query logging in PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();
```

### 3. Index Optimization

**Current indexes are good**, but monitor with:

```sql
-- Find missing indexes (unused foreign keys)
SELECT
  c.conrelid::regclass AS table_name,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_def
FROM pg_constraint c
WHERE c.contype = 'f'
AND NOT EXISTS (
  SELECT 1 FROM pg_index i
  WHERE i.indrelid = c.conrelid
  AND c.conkey <@ i.indkey
);

-- Find unused indexes
SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
  idx_scan AS scans
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan < 50
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

### 4. Read Replicas (High Traffic)

For read-heavy workloads, add read replicas:

```typescript
// lib/db.ts - Read replica support
const writePool = new Pool({ connectionString: process.env.DATABASE_URL })
const readPool = new Pool({ connectionString: process.env.DATABASE_READ_URL })

export async function queryRead<T>(text: string, params?: unknown[]) {
  return readPool.query(text, params)
}

export async function queryWrite<T>(text: string, params?: unknown[]) {
  return writePool.query(text, params)
}
```

### 5. Database Maintenance

```sql
-- Regular maintenance tasks (run weekly via cron)
VACUUM ANALYZE;
REINDEX DATABASE cda_db;

-- Monitor table bloat
SELECT
  schemaname || '.' || relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Application-Level Caching

### 1. Add Redis for Rate Limiting & Sessions

**Current**: Rate limiting uses database (slow, adds DB load).

**Recommended**: Use Redis.

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

**Redis Rate Limiting Implementation**:

```typescript
// lib/redis.ts
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })
redis.connect()

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate:${action}:${identifier}`

  const multi = redis.multi()
  multi.incr(key)
  multi.pExpire(key, windowMs)

  const results = await multi.exec()
  const count = results[0] as number

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count)
  }
}
```

### 2. API Response Caching

```typescript
// lib/cache.ts
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function cacheSet(key: string, data: unknown, ttlSeconds = 300) {
  await redis.setEx(key, ttlSeconds, JSON.stringify(data))
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const cacheKey = 'events:highlighted'

  // Check cache first
  const cached = await cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  // Query database
  const event = await getHighlightedEvent()

  // Cache for 5 minutes
  await cacheSet(cacheKey, event, 300)

  return NextResponse.json(event)
}
```

### 3. Session Caching

Move sessions from database to Redis for faster auth checks:

```typescript
// lib/session-cache.ts
export async function cacheSession(token: string, session: Session) {
  await redis.setEx(
    `session:${token}`,
    86400, // 24 hours
    JSON.stringify(session)
  )
}

export async function getCachedSession(token: string): Promise<Session | null> {
  const data = await redis.get(`session:${token}`)
  return data ? JSON.parse(data) : null
}
```

---

## Horizontal Scaling

### 1. Stateless Application Design

**Current state**: Application is already mostly stateless (good!).

**Checklist**:
- [x] No file-based sessions
- [x] Database-backed sessions
- [x] No local file uploads (use S3/CDN for future)
- [x] Environment-based configuration

### 2. Load Balancing with Docker Compose

```yaml
# docker-compose.prod.yml
services:
  app:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
```

**nginx.conf for load balancing**:
```nginx
upstream app_servers {
    least_conn;
    server app:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Kubernetes Deployment (Production Scale)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cda-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cda-app
  template:
    metadata:
      labels:
        app: cda-app
    spec:
      containers:
      - name: app
        image: cda-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cda-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: cda-app
spec:
  selector:
    app: cda-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cda-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cda-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Monitoring & Observability

### 1. Health Check Endpoint

Create `/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await query('SELECT 1')

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
```

### 2. Prometheus Metrics (Optional)

```typescript
// lib/metrics.ts
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'

const register = new Registry()
collectDefaultMetrics({ register })

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
})

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  registers: [register]
})

export { register }
```

---

## Quick Reference: Optimization Priorities

| Priority | Optimization | Impact | Effort |
|----------|--------------|--------|--------|
| 1 | Enable BuildKit caching | High | Low |
| 2 | Migrate to Bun in Docker | High | Medium |
| 3 | Add Redis for rate limiting | High | Medium |
| 4 | Add health check endpoint | Medium | Low |
| 5 | PgBouncer for connection pooling | Medium | Medium |
| 6 | Kubernetes deployment | High | High |

---

## Summary

1. **Immediate wins**: Enable BuildKit, optimize Dockerfile layers
2. **Short-term**: Migrate to Bun in Docker, add Redis caching
3. **Medium-term**: PgBouncer, read replicas, monitoring
4. **Long-term**: Kubernetes, auto-scaling, full observability stack
