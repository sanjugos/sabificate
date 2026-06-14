# SABIficate Technical Specification

**Version:** 2.0
**Date:** 2026-06-14
**Status:** DRAFT -- Pending Founder Working Session
**Author:** Engineering (Sanju)
**Based on:** Council Synthesis (2026-06-14), Technology Landscape Research, Existing Specs (Round 7), Regulatory Corpus

---

## 1. System Architecture

```
                            +---------------------------+
                            |     Nigerian Learner      |
                            |  (Tecno/Infinix/Samsung)  |
                            +-------------+-------------+
                                          |
                                          | HTTPS
                                          v
                    +---------------------------------------------+
                    |         Cloudflare Pro (Lagos PoP)          |
                    |  - TLS termination                          |
                    |  - Brotli compression                       |
                    |  - Static asset cache (96%+ hit rate)       |
                    |  - HTTP/3 (QUIC)                            |
                    |  - Image Resizing (AVIF/WebP)               |
                    |  - Smart Tiered Cache                       |
                    +-----+------------------+--------------------+
                          |                  |
                          v                  v
              +-----------+---------+  +-----+--------------+
              | Cloudflare Workers  |  | Cloudflare R2      |
              | ($5/mo)             |  | (Media Storage)    |
              | - Edge JWT validate |  | - Course images    |
              | - GLO AS detection  |  | - Lesson assets    |
              | - Rate limiting     |  | - Certificate PDFs |
              | - 302 redirect GLO  |  | - $0 egress        |
              +-----------+---------+  +--------------------+
                          |
                          | ~110ms RTT
                          v
        +----------------------------------------------+
        |      Hetzner Nuremberg CX33                  |
        |      (4 vCPU, 8GB RAM, 80GB NVMe)            |
        |                                              |
        |  +----------------+  +--------------------+  |
        |  | Node.js API    |  | PostgreSQL 16      |  |
        |  | (Fastify)      |  | (App tables)       |  |
        |  | - REST API     |  | - Courses          |  |
        |  | - Auth         |  | - Content (JSONB)  |  |
        |  | - BullMQ jobs  |  | - Payments         |  |
        |  | - WebSocket    |  | - Subscriptions    |  |
        |  +----------------+  | - Organizations    |  |
        |                      | - Credentials      |  |
        |  +----------------+  | - pgvector (RAG)   |  |
        |  | Redis 7        |  +--------------------+  |
        |  | - Sessions     |                          |
        |  | - Cache        |                          |
        |  | - BullMQ queue |                          |
        |  +----------------+                          |
        +----------------------------------------------+
                          |
         +----------------+------------------+
         |                                   |
         v                                   v
+--------+-----------+            +----------+---------+
| Nigerian PostgreSQL|            | External Services  |
| (Layer3Cloud Lagos |            |                    |
|  or MainOne)       |            | - Paystack API     |
| - User PII         |            | - Claude API       |
| - LearnerProgress  |            |   (Batch + Haiku)  |
| - AssessmentAttempt |            | - WhatsApp         |
| - TutorConversation|            |   Business API     |
| - TutorMessage     |            | - SMTP (email)     |
| - Behavioral data  |            +--------------------+
+--------------------+

         +-------------------------------+
         |   GLO Fallback Path           |
         |                               |
         |   glo.sabificate.com          |
         |   (grey-cloud, no CF proxy)   |
         |          |                    |
         |          v                    |
         |   Hetzner CX23 (~$4/mo)      |
         |   Nginx reverse proxy         |
         |   -> Hetzner CX33 origin      |
         +-------------------------------+
```

### Architecture Principles

1. **Edge-first:** Cloudflare Lagos PoP handles TLS, caching, JWT validation, and GLO detection -- reducing origin round-trips.
2. **Split-database:** NDPA-regulated PII tables reside in Nigeria. Application tables remain on Hetzner for cost and reliability.
3. **Foreground-first sync:** Never depend on background processes for critical data. Transsion devices (50.69% market) kill background Chrome within 60-90 seconds.
4. **Data-saver default:** Every new user starts in Data Saver mode. Data costs ~NGN 638/GB.
5. **Offline-resilient:** IndexedDB (Dexie.js) as local source of truth. Service worker for app shell. User-initiated content downloads only.

---

## 2. Frontend Architecture

### 2.1 Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework (compiler eliminates manual memoization) |
| Vite | 6.x | Build tool (tree-shaking, code splitting) |
| Tailwind CSS | 4.x | Styling (Rust engine, 21-40% smaller CSS than v3) |
| vite-plugin-pwa | 1.3.0 | PWA generation with Workbox integration |
| Workbox | 7.4.1 | Service worker strategies |
| Dexie.js | 4.x | IndexedDB wrapper for offline data |
| react-paystack | latest | Paystack payment integration |
| day.js | 1.x | Date handling (2KB vs moment.js 72KB) |

### 2.2 PWA Configuration

**Service Worker Strategy:** `generateSW` via vite-plugin-pwa (Workbox auto-generates the service worker).

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt', // prompt user to reload on update
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg}'],
        maximumFileSizeToCacheInBytes: 200 * 1024, // 200KB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.sabificate\.com\/api\/v1\/courses/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'course-catalog',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.sabificate\.com\/.+\.(png|jpg|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lesson-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.sabificate\.com\/api\/v1\/learner/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'learner-data',
              networkTimeoutSeconds: 3,
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: 'SABIficate',
        short_name: 'SABIficate',
        description: 'Professional development for Nigerian professionals',
        theme_color: '#1a5632',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-dexie': ['dexie'],
          'vendor-dayjs': ['dayjs'],
        },
      },
    },
    target: 'es2020',
    cssMinify: 'lightningcss',
  },
});
```

### 2.3 Code Splitting Strategy

| Chunk | Contents | Load Trigger | Budget |
|-------|----------|-------------|--------|
| `app-shell` | Router, layout, nav, auth context | Initial load | <50KB gzip |
| `vendor-react` | react, react-dom, react-router-dom | Initial load | <45KB gzip |
| `vendor-dexie` | Dexie.js | Initial load | <25KB gzip |
| `vendor-dayjs` | dayjs + locale | Initial load | <5KB gzip |
| `lesson-player` | Lesson renderer, quiz components, content blocks | `React.lazy` on /lesson/:id | <40KB gzip |
| `course-catalog` | Browse, search, filter | `React.lazy` on /courses | <25KB gzip |
| `admin` | Corporate dashboard, bulk enrollment, reports | `React.lazy` on /admin/* | <60KB gzip |
| `paystack` | @paystack/inline-js, payment flows | `React.lazy` on /payment/* | <30KB gzip |
| `credentials` | Credential viewer, QR, sharing | `React.lazy` on /credentials/* | <20KB gzip |
| `settings` | Profile, data saver, storage dashboard | `React.lazy` on /settings/* | <15KB gzip |

**Lazy-load pattern:**

```tsx
const LessonPlayer = React.lazy(() => import('./pages/LessonPlayer'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const PaymentFlow = React.lazy(() => import('./pages/PaymentFlow'));

// In router:
<Suspense fallback={<LessonSkeleton />}>
  <LessonPlayer />
</Suspense>
```

### 2.4 Performance Budgets

| Metric | Target | Measurement | Enforcement |
|--------|--------|-------------|-------------|
| Critical-path JS (gzip) | <170KB | `vite build --report` | CI fail if exceeded |
| Total initial JS (gzip) | <200KB | Lighthouse | CI fail if exceeded |
| CSS (gzip) | <15KB | Build output | CI fail if exceeded |
| Largest vendor chunk | <120KB gzip | Build output | CI warning |
| Time to Interactive (3G) | <5s | Lighthouse throttled | CI warning |
| Largest Contentful Paint | <2.5s | Lighthouse | CI warning |
| Total initial page weight | <500KB | Lighthouse | CI warning |
| Service worker file | <15KB | Build output | CI fail if exceeded |
| App shell precache total | <200KB gzip | Workbox manifest | CI fail if exceeded |

### 2.5 Dexie.js IndexedDB Schema

```ts
// db.ts
import Dexie, { Table } from 'dexie';

export interface OfflineLesson {
  id: string;            // lesson UUID
  courseId: string;
  moduleId: string;
  title: string;
  contentBlocks: ContentBlock[];  // full JSON content
  tier: 'full' | 'data_saver' | 'ultra_light';
  downloadedAt: number;  // timestamp
  sizeBytes: number;
  lastAccessedAt: number;
}

export interface OfflineProgress {
  id: string;            // lessonId + '-' + visitorId
  lessonId: string;
  courseId: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  timeSpentSeconds: number;
  completedAt?: number;
  lastUpdatedAt: number;
  synced: boolean;
}

export interface OfflineQuizAnswer {
  id: string;            // auto-generated UUID
  assessmentId: string;
  lessonId: string;
  courseId: string;
  answersJson: string;
  scorePercent?: number;
  attemptNumber: number;
  submittedAt: number;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'progress' | 'quiz_answer' | 'lesson_complete';
  payload: string;       // JSON-serialized
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  status: 'pending' | 'in_flight' | 'failed';
}

class SABIficateDB extends Dexie {
  lessons!: Table<OfflineLesson>;
  progress!: Table<OfflineProgress>;
  quizAnswers!: Table<OfflineQuizAnswer>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('sabificate');

    // Version 1: Initial schema
    this.version(1).stores({
      lessons: 'id, courseId, moduleId, downloadedAt, lastAccessedAt',
      progress: 'id, lessonId, courseId, synced, lastUpdatedAt',
      quizAnswers: 'id, assessmentId, lessonId, synced, submittedAt',
      syncQueue: 'id, type, status, createdAt',
    });

    // Version 2 example: Adding tier index for storage management
    // this.version(2).stores({
    //   lessons: 'id, courseId, moduleId, tier, downloadedAt, lastAccessedAt',
    // });
  }
}

export const db = new SABIficateDB();
```

**Version migration pattern:** Dexie handles schema migrations automatically. Add new versions sequentially. Never modify an existing version -- always increment.

### 2.6 Three-Tier Content Delivery

| Tier | Label | Content Included | Est. Size/Lesson | Default |
|------|-------|-----------------|------------------|---------|
| 1 | Full Experience | Text + images + diagrams + interactive quizzes + scenario animations | 200-500KB | No |
| 2 | Data Saver | Text + compressed images (max 800px) + quizzes (no animations) | 50-150KB | YES |
| 3 | Ultra Light | Text only + inline quiz (no images) | <50KB | No |

**Implementation:**

```tsx
// ContentTierContext.tsx
type ContentTier = 'full' | 'data_saver' | 'ultra_light';

const ContentTierContext = createContext<{
  tier: ContentTier;
  setTier: (tier: ContentTier) => void;
}>({ tier: 'data_saver', setTier: () => {} });

// Shown in app header at all times
function TierIndicator() {
  const { tier } = useContentTier();
  const labels = {
    full: 'Full',
    data_saver: 'Data Saver',
    ultra_light: 'Ultra Light',
  };
  return <span className="text-xs bg-green-100 px-2 py-0.5 rounded">{labels[tier]}</span>;
}
```

The tier is persisted in localStorage and applied at content fetch time. The API accepts a `tier` query parameter to return the appropriate content variant.

### 2.7 Foreground-First Sync

Foreground-first sync is the PRIMARY data strategy. Background Sync is SECONDARY and OPPORTUNISTIC.

```
User submits quiz answer
    |
    v
Write to IndexedDB (Dexie) immediately
    |
    +-- Show "Saved locally" indicator (checkmark)
    |
    v
Attempt POST to API (foreground)
    |
    +-- Success: Mark synced=true in IndexedDB
    |             Show "Synced" indicator (cloud checkmark)
    |
    +-- Failure (network error):
              Add to syncQueue table
              Show "Pending sync" indicator (cloud with arrow)
              |
              +-- On next app open or network change event:
              |     Process syncQueue (foreground)
              |
              +-- Register Background Sync (OPPORTUNISTIC)
                    May or may not fire on Transsion devices
```

**Sync status indicators (always visible):**

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Saved locally | Checkmark | Grey | Data in IndexedDB, not yet synced |
| Syncing | Spinning arrow | Blue | POST in flight |
| Synced | Cloud + checkmark | Green | Server confirmed |
| Sync failed | Cloud + X | Red | Retrying, tap for details |
| X items pending | Badge count | Orange | Items in sync queue |

### 2.8 Connection-Aware Behavior

Do NOT rely on the Network Information API (`navigator.connection`) alone -- it is unreliable on many devices and reports theoretical maximums rather than actual throughput.

**Measured throughput approach:**

```ts
// network-monitor.ts
class NetworkMonitor {
  private measurements: number[] = []; // last 5 throughputs in Mbps
  private readonly WINDOW_SIZE = 5;

  async measure(responseBytes: number, durationMs: number): Promise<void> {
    const mbps = (responseBytes * 8) / (durationMs * 1000); // bits per ms -> Mbps
    this.measurements.push(mbps);
    if (this.measurements.length > this.WINDOW_SIZE) {
      this.measurements.shift();
    }
  }

  get effectiveSpeed(): 'fast' | 'moderate' | 'slow' | 'offline' {
    if (!navigator.onLine) return 'offline';
    if (this.measurements.length === 0) return 'moderate'; // assume moderate until measured
    const avg = this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;
    if (avg >= 5) return 'fast';      // ~4G
    if (avg >= 0.5) return 'moderate'; // ~3G
    return 'slow';                     // ~2G
  }

  get timeoutMs(): number {
    switch (this.effectiveSpeed) {
      case 'fast': return 3000;     // 3s
      case 'moderate': return 8000; // 8s
      case 'slow': return 15000;    // 15s
      case 'offline': return 1000;  // fail fast
    }
  }
}

export const networkMonitor = new NetworkMonitor();
```

Every API call and asset fetch records its throughput. The rolling 5-request average determines timeouts and content tier suggestions.

### 2.9 Storage Management

```ts
// storage-manager.ts
const SYNC_PARTITION_BYTES = 5 * 1024 * 1024; // 5MB reserved for sync data

async function getStorageStatus(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  availableForDownloads: number;
}> {
  const estimate = await navigator.storage.estimate();
  const used = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const availableForDownloads = Math.max(0, quota - used - SYNC_PARTITION_BYTES);
  return {
    usedBytes: used,
    quotaBytes: quota,
    percentUsed: quota > 0 ? (used / quota) * 100 : 0,
    availableForDownloads,
  };
}

// LRU eviction: remove oldest completed courses first
async function evictOldContent(bytesNeeded: number): Promise<boolean> {
  const completedLessons = await db.lessons
    .orderBy('lastAccessedAt')
    .filter(l => {
      const progress = await db.progress.get(l.id);
      return progress?.status === 'completed';
    })
    .toArray();

  let freedBytes = 0;
  for (const lesson of completedLessons) {
    if (freedBytes >= bytesNeeded) break;
    await db.lessons.delete(lesson.id);
    freedBytes += lesson.sizeBytes;
  }
  return freedBytes >= bytesNeeded;
}
```

**Storage dashboard (first-class feature):**
- Per-course storage usage with delete buttons
- Naira cost estimate per download (based on lesson size and ~NGN 638/GB)
- Available space indicator
- "Clear completed courses" bulk action
- Warning at 80% quota usage

### 2.10 A2HS Install Prompt

Trigger the Add-to-Home-Screen prompt on the user's **second visit** with clear offline benefit messaging.

```ts
// install-prompt.ts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const visitCount = parseInt(localStorage.getItem('visit_count') ?? '0', 10) + 1;
  localStorage.setItem('visit_count', String(visitCount));

  if (visitCount >= 2 && !localStorage.getItem('install_dismissed')) {
    showInstallBanner();
  }
});

function showInstallBanner() {
  // Show banner with messaging:
  // "Install SABIficate to learn offline -- even without data"
  // "Takes less than 1MB. Works without internet."
}
```

### 2.11 Cache Health Check

On every app open, verify the service worker cache is intact (mitigates HiOS Phone Master cache-clearing).

```ts
// cache-health.ts
async function checkCacheHealth(): Promise<boolean> {
  try {
    const cache = await caches.open('workbox-precache-v2');
    const keys = await cache.keys();
    if (keys.length === 0) {
      // Cache was cleared -- trigger re-precache
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: 'CACHE_REBUILD' });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
```

---

## 3. Backend Architecture

### 3.1 Framework Recommendation: Fastify

**Recommendation: Fastify** over Express for the following reasons:

| Factor | Fastify | Express |
|--------|---------|---------|
| Performance | ~78,000 req/s | ~15,000 req/s |
| Schema validation | Built-in (JSON Schema, compiled) | Requires middleware (joi/zod) |
| TypeScript | First-class | Requires @types/express |
| Plugin system | Encapsulated, async-aware | Middleware chain |
| Logging | Built-in pino (structured JSON) | Requires morgan + winston |
| JSON serialization | fast-json-stringify (2-5x faster) | JSON.stringify |

Fastify's schema-based validation compiles validators at startup, producing consistent sub-millisecond validation even on the CX33.

### 3.2 Node.js API Server Structure

```
src/
  server.ts              # Fastify instance, plugin registration
  config/
    env.ts               # Environment variables (dotenv)
    database.ts          # PostgreSQL connection pools
    redis.ts             # Redis connection
  plugins/
    auth.ts              # JWT verification, PKCE
    rate-limit.ts        # Rate limiting plugin
    cors.ts              # CORS configuration
  routes/
    v1/
      auth.ts            # Login, register, refresh, logout
      courses.ts         # Course catalog, search
      learner.ts         # Progress, quiz submissions
      admin.ts           # Corporate dashboard, bulk enrollment
      payments.ts        # Paystack integration, webhooks
      whatsapp.ts        # WhatsApp webhook, subscription
      credentials.ts     # Credential issuance, verification
      compliance.ts      # CPD/ITF reports
      offline.ts         # Sync endpoints
  services/
    auth.service.ts
    course.service.ts
    learner.service.ts
    payment.service.ts
    whatsapp.service.ts
    credential.service.ts
    ai-pipeline.service.ts
    sync.service.ts
  models/
    user.ts
    course.ts
    lesson.ts
    payment.ts
    subscription.ts
    credential.ts
  jobs/
    dunning.job.ts       # Payment retry
    whatsapp-lesson.job.ts
    content-sync.job.ts
    report-generation.job.ts
    credential-issuance.job.ts
  middleware/
    error-handler.ts
    request-logger.ts
  utils/
    pii-stripper.ts      # Remove PII before Claude API calls
    naira.ts             # Currency formatting (kobo/NGN)
    bloom-taxonomy.ts    # Quiz classification
```

### 3.3 Split PostgreSQL Strategy

**Hetzner Nuremberg PostgreSQL (Application Data):**

| Table | Purpose | Sensitive? |
|-------|---------|-----------|
| organization | Company profiles | No |
| department | Org structure | No |
| course | Course metadata | No |
| course_category | Taxonomy | No |
| module | Course structure | No |
| lesson | Content blocks (JSONB) | No |
| lesson_media | Media URLs | No |
| enrollment | Enrollment records | No |
| subscription | Subscription state | No |
| subscription_plan | Plan definitions | No |
| payment_transaction | Payment records (no card data) | No |
| invoice | B2B invoices | No |
| credential_template | Certificate templates | No |
| issued_credential | Issued certificates | No |
| badge / badge_award | Gamification | No |
| xp_transaction | XP records | No |
| cohort / pod | Cohort structure | No |
| whatsapp_template | Template definitions | No |
| tutor_knowledge_base | RAG documents | No |
| promo_code | Discount codes | No |

**Nigerian PostgreSQL (PII and Behavioral Data):**

| Table | Purpose | Why Nigeria? |
|-------|---------|-------------|
| user | PII (name, email, phone, employee_id) | NDPA data domicile |
| learner_progress | Individual learning behavior | Behavioral data |
| assessment_attempt | Quiz answers and scores | Individual performance |
| tutor_conversation | AI chat sessions | Contains personal context |
| tutor_message | Chat messages | Contains personal data |
| streak | Individual engagement patterns | Behavioral data |
| whatsapp_subscription | Phone numbers | PII |
| whatsapp_message | Message content | Personal communications |
| offline_progress_queue | Synced offline data | Individual activity |

**Connection pooling:**

```ts
// database.ts
import { Pool } from 'pg';

// Application database (Hetzner Nuremberg)
export const appDb = new Pool({
  host: process.env.APP_DB_HOST,    // localhost (same server)
  port: 5432,
  database: 'sabificate_app',
  user: process.env.APP_DB_USER,
  password: process.env.APP_DB_PASSWORD,
  max: 20,                          // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,                       // localhost, no SSL needed
});

// PII database (Nigerian host)
export const piiDb = new Pool({
  host: process.env.PII_DB_HOST,    // Layer3Cloud Lagos or MainOne
  port: 5432,
  database: 'sabificate_pii',
  user: process.env.PII_DB_USER,
  password: process.env.PII_DB_PASSWORD,
  max: 10,                          // fewer connections (cross-network)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,   // higher timeout for cross-network
  ssl: { rejectUnauthorized: true },
});

// Fallback: If Nigerian hosting proves unreliable, consolidate to
// single Hetzner database with Standard Contractual Clauses and
// intercompany DPA as NDPA transfer mechanism.
```

**Cross-database query pattern:**

```ts
// Example: Get user with their course progress
async function getUserWithProgress(userId: string) {
  const [user, progress] = await Promise.all([
    piiDb.query('SELECT * FROM "user" WHERE id = $1', [userId]),
    piiDb.query('SELECT * FROM learner_progress WHERE user_id = $1', [userId]),
  ]);
  const enrollments = await appDb.query(
    'SELECT e.*, c.title, c.slug FROM enrollment e JOIN course c ON e.course_id = c.id WHERE e.user_id = $1',
    [userId]
  );
  return { ...user.rows[0], progress: progress.rows, enrollments: enrollments.rows };
}
```

### 3.4 Redis Configuration

```ts
// redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

// Namespaced key patterns:
// sess:{sessionId}          - User sessions (TTL: 7 days)
// cache:course:{slug}       - Course metadata (TTL: 1 hour)
// cache:catalog:{hash}      - Catalog queries (TTL: 10 minutes)
// ratelimit:{ip}:{endpoint} - Rate limiting counters
// bull:*                    - BullMQ job queues
```

**BullMQ job queues:**

| Queue | Purpose | Concurrency | Retry |
|-------|---------|-------------|-------|
| `email` | Transactional email (welcome, enrollment, receipt) | 5 | 3x exponential |
| `whatsapp` | WhatsApp message dispatch | 3 | 3x, 30s interval |
| `dunning` | Payment retry and notifications | 1 | Per schedule (see Section 5) |
| `content-pipeline` | AI content generation jobs | 2 | 2x |
| `report` | PDF report generation (ITF, CPD) | 2 | 2x |
| `credential` | Credential issuance and signing | 2 | 3x |
| `sync` | Batch sync processing | 3 | 5x |

### 3.5 Authentication

**OAuth 2.0 + PKCE Flow:**

```
Client (PWA)                    API Server                  Edge (CF Worker)
    |                               |                           |
    |-- 1. Generate code_verifier --|                           |
    |   + code_challenge (S256)     |                           |
    |                               |                           |
    |-- 2. POST /auth/login ------->|                           |
    |   { email, password,          |                           |
    |     code_challenge,           |                           |
    |     code_challenge_method }   |                           |
    |                               |-- Verify password         |
    |                               |   (bcrypt cost 12)        |
    |                               |                           |
    |<- 3. { authorization_code } --|                           |
    |                               |                           |
    |-- 4. POST /auth/token ------->|                           |
    |   { authorization_code,       |                           |
    |     code_verifier }           |                           |
    |                               |-- Verify S256(verifier)   |
    |                               |   == stored challenge     |
    |                               |                           |
    |<- 5. { access_token (JWT),  --|                           |
    |        refresh_token          |                           |
    |        (httpOnly cookie) }    |                           |
    |                               |                           |
    |-- 6. GET /api/v1/courses ---->|                           |
    |   Authorization: Bearer JWT   |                           |
    |                               |                           |
    |                           [Request hits CF Worker first]  |
    |                               |<-- 7. Validate JWT -------|
    |                               |    (check sig, exp, iss)  |
    |                               |    If invalid: 401        |
    |                               |    If valid: forward      |
    |                               |                           |
```

**JWT structure:**

```json
{
  "sub": "user-uuid",
  "role": "learner",
  "org_id": "org-uuid-or-null",
  "iss": "sabificate",
  "iat": 1718000000,
  "exp": 1718000900
}
```

| Parameter | Value |
|-----------|-------|
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Refresh token storage | httpOnly, Secure, SameSite=Strict cookie |
| Password hashing | bcrypt, cost factor 12 |
| Failed login limit | 5 attempts per 15 minutes |
| Lockout duration | Progressive: 15min, 30min, 1hr, 24hr |
| 2FA | Optional TOTP for corporate_admin and platform_admin roles |
| JWT signing | HS256 with 256-bit secret (symmetric, single origin) |

**Edge JWT Validation (Cloudflare Worker):**

```ts
// worker/jwt-validator.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Skip auth for public endpoints
    if (isPublicEndpoint(url.pathname)) {
      return fetch(request);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);

      // GLO AS number detection
      const asn = request.cf?.asn;
      if (asn === 37148 || asn === 29465) { // GLO AS numbers
        return Response.redirect(`https://glo.sabificate.com${url.pathname}${url.search}`, 302);
      }

      // Forward to origin with validated user context
      const headers = new Headers(request.headers);
      headers.set('X-User-Id', payload.sub);
      headers.set('X-User-Role', payload.role);
      headers.set('X-Org-Id', payload.org_id ?? '');

      return fetch(new Request(request.url, {
        method: request.method,
        headers,
        body: request.body,
      }));
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

### 3.6 Rate Limiting Strategy

| Endpoint Group | Limit | Window | Scope |
|---------------|-------|--------|-------|
| POST /auth/login | 5 requests | 15 minutes | Per IP |
| POST /auth/register | 3 requests | 1 hour | Per IP |
| POST /auth/token (refresh) | 10 requests | 15 minutes | Per user |
| GET /api/v1/* (authenticated) | 100 requests | 1 minute | Per user |
| POST /api/v1/learner/* | 30 requests | 1 minute | Per user |
| POST /api/v1/payments/* | 10 requests | 1 minute | Per user |
| POST /api/v1/whatsapp/webhook | 1000 requests | 1 minute | Per IP (Paystack/Meta) |
| POST /api/v1/admin/* | 60 requests | 1 minute | Per user |
| GET /api/v1/courses (public) | 30 requests | 1 minute | Per IP |

Rate limiting is implemented at two layers:
1. **Edge (Cloudflare Workers):** IP-based rate limiting for auth endpoints using Workers KV counters.
2. **Origin (Fastify):** User-based rate limiting using Redis sliding window counters via `@fastify/rate-limit`.

---

## 4. AI Content Pipeline

### 4.1 Pipeline Architecture

The content pipeline is a 5-stage multi-agent system. Each stage has a specialized prompt, defined input/output schema, and quality gate.

```
SME Brief (markdown document)
  + Nigerian Business Context Library (RAG corpus)
    |
    v
+-------------------+     +-------------------+     +---------------------------+
| Stage 1:          |     | Stage 2:          |     | Stage 3:                  |
| lesson_generator  |---->| quiz_generator    |---->| adaptive_variant_generator|
| (Sonnet 4.6 Batch)|     | (Sonnet 4.6 Batch)|     | (Sonnet 4.6 Batch)        |
|                   |     |                   |     |                           |
| Input: SME brief  |     | Input: lesson     |     | Input: base lesson        |
| Output: base      |     | Output: 3-5 quiz  |     | Output: beginner,         |
|   lesson JSON     |     |   items per lesson |     |   intermediate, advanced  |
+-------------------+     +-------------------+     |   variant lessons         |
                                                    +---------------------------+
                                                              |
                                                              v
                          +-------------------+     +-------------------+
                          | Stage 5:          |     | Stage 4:          |
                          | validation_agent  |<----| artifact_prompt   |
                          | (Sonnet 4.6 Batch)|     |   _generator      |
                          |                   |     | (Sonnet 4.6 Batch)|
                          | Input: complete   |     |                   |
                          |   course package  |     | Input: lesson +   |
                          | Output: pass/fail |     |   target role     |
                          |   + issue list    |     | Output: workplace |
                          +-------------------+     |   artifact prompt |
                                                    +-------------------+
```

**Model selection:**
- **All batch generation:** Claude Sonnet 4.6 via Batch API (50% discount: $1.50/$7.50 per MTok)
- **Estimated cost per course** (with 3 adaptive variants, quizzes, artifact prompts): $0.05-0.10 via Batch API
- **100 courses:** $5-10 total

**Provider abstraction layer:**

```ts
// ai/provider.ts
interface AIProvider {
  generateContent(prompt: string, options: GenerateOptions): Promise<string>;
  batchGenerate(prompts: BatchPrompt[]): Promise<BatchResult[]>;
}

interface GenerateOptions {
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  responseFormat?: 'json' | 'text';
}

class AnthropicProvider implements AIProvider {
  // Claude Sonnet 4.6 via Batch API
  async batchGenerate(prompts: BatchPrompt[]): Promise<BatchResult[]> {
    // Uses Anthropic Batch API with prompt caching
    // System prompt cached across batch (90% token reduction)
  }
}

// Future: class OpenAIProvider implements AIProvider { ... }
// Future: class GeminiProvider implements AIProvider { ... }
```

### 4.2 JSON Content Schema

This is the canonical output format of the AI pipeline. The React component library renders these blocks.

```ts
// content-schema.ts

type ContentBlock =
  | TextBlock
  | QuizBlock
  | ArtifactPromptBlock
  | ScenarioBlock
  | ImageBlock
  | CalloutBlock
  | CodeBlock;

interface TextBlock {
  type: 'text_block';
  id: string;
  content: string;                    // Markdown text
  difficulty_tier: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time_seconds: number;
}

interface QuizBlock {
  type: 'quiz_block';
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: QuizOption[];
  correct_answer_index: number;       // 0-based
  explanation: string;                // Shown after answer
  explanation_wrong?: string;         // Shown on wrong answer
  bloom_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  difficulty_tier: 'beginner' | 'intermediate' | 'advanced';
  nigerian_context?: string;          // Optional: regulatory body, company type
}

interface QuizOption {
  text: string;
  feedback?: string;                  // Per-option feedback
}

interface ArtifactPromptBlock {
  type: 'artifact_prompt_block';
  id: string;
  prompt: string;                     // The assignment
  target_role: string;                // e.g., "HR Manager at a Tier-1 Nigerian bank"
  industry_vertical: string;          // e.g., "Banking & Finance"
  career_level: 'entry' | 'mid' | 'senior' | 'executive';
  deliverable_format: string;         // e.g., "1-page memo", "Excel template", "presentation outline"
  evaluation_criteria: string[];      // Rubric points
  estimated_time_minutes: number;
  nigerian_context: {
    company_type?: string;            // e.g., "Commercial bank (Tier 1)"
    regulatory_body?: string;         // e.g., "CBN", "ICAN"
    cultural_notes?: string;          // e.g., "Consider hierarchical reporting structures"
  };
}

interface ScenarioBlock {
  type: 'scenario_block';
  id: string;
  title: string;
  narrative: string;                  // Story/situation description
  characters: ScenarioCharacter[];
  decision_points: DecisionPoint[];
  difficulty_tier: 'beginner' | 'intermediate' | 'advanced';
  nigerian_context: {
    company_type: string;
    regulatory_body?: string;
    cultural_notes?: string;
    location?: string;                // e.g., "Lagos Island", "Abuja FCT"
  };
}

interface ScenarioCharacter {
  name: string;                       // Nigerian names
  role: string;
  perspective: string;
}

interface DecisionPoint {
  prompt: string;
  options: { text: string; outcome: string; is_optimal: boolean }[];
}

interface ImageBlock {
  type: 'image_block';
  id: string;
  url: string;                        // R2 URL
  alt_text: string;
  caption?: string;
  width_px: number;
  data_saver_url?: string;            // Compressed version
  // Ultra Light tier: image omitted entirely
}

interface CalloutBlock {
  type: 'callout_block';
  id: string;
  variant: 'info' | 'warning' | 'tip' | 'regulation';
  title?: string;
  content: string;
  regulatory_reference?: string;      // e.g., "CBN Circular BSD/DIR/GEN/LAB/14/032"
}

interface CodeBlock {
  type: 'code_block';
  id: string;
  language: string;
  code: string;
  caption?: string;
}

// Full lesson structure
interface LessonContent {
  lesson_id: string;
  version: number;
  difficulty_tier: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  learning_objectives: string[];
  blocks: ContentBlock[];
  estimated_duration_minutes: number;
  cpd_minutes: number;
  tags: string[];
  metadata: {
    generated_by: string;             // "sonnet-4.6-batch"
    generated_at: string;             // ISO timestamp
    sme_reviewed: boolean;
    sme_reviewer_id?: string;
    review_tier: 'automated' | 'lightweight' | 'deep';
    bloom_distribution: Record<string, number>;  // % per Bloom level
  };
}

// Full course structure
interface CoursePackage {
  course_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  modules: {
    module_id: string;
    title: string;
    lessons: {
      lesson_id: string;
      variants: {
        beginner: LessonContent;
        intermediate: LessonContent;
        advanced: LessonContent;
      };
    }[];
  }[];
}
```

**Storage:** Each lesson variant is stored as an independent JSONB column in the `lesson` table. Not as lexical substitution on a shared template.

```sql
CREATE TABLE lesson (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES module(id),
  title VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL,
  content_beginner JSONB,       -- LessonContent for beginner tier
  content_intermediate JSONB,   -- LessonContent for intermediate tier
  content_advanced JSONB,       -- LessonContent for advanced tier
  estimated_duration_minutes INTEGER,
  cpd_minutes INTEGER DEFAULT 0,
  offline_available BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Batch API Integration with Prompt Caching

```ts
// ai/batch-generator.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function generateCourseContent(smeBrief: string, contextLibrary: string): Promise<CoursePackage> {
  // Stage 1: Generate base lessons
  const lessonBatch = await anthropic.messages.batches.create({
    requests: modules.map((mod, i) => ({
      custom_id: `lesson-${i}`,
      params: {
        model: 'claude-sonnet-4-6-20260514',
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: LESSON_GENERATOR_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },  // Prompt caching
          },
          {
            type: 'text',
            text: contextLibrary,                    // Nigerian Business Context Library
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Generate a microlesson for: ${mod.title}\n\nSME Brief:\n${smeBrief}\n\nOutput JSON matching the LessonContent schema.`,
          },
        ],
      },
    })),
  });

  // Poll for batch completion (Batch API processes within 24h, typically <1h)
  let result = await anthropic.messages.batches.retrieve(lessonBatch.id);
  while (result.processing_status === 'in_progress') {
    await new Promise(r => setTimeout(r, 60000)); // Check every minute
    result = await anthropic.messages.batches.retrieve(lessonBatch.id);
  }

  // Stages 2-5 follow the same pattern with specialized prompts
  // ...
}
```

**Prompt caching savings:** The system prompt + Nigerian Business Context Library (~20,000 tokens) is cached across all requests in a batch. At standard rates, this saves ~$0.06 per course in input token costs.

### 4.4 Nigerian Business Context Library (RAG Corpus)

The Context Library is a curated corpus created during Phase 0 (Weeks 1-3) by Gbitse. It serves as a RAG source for all AI content generation prompts.

**Corpus structure:**

```
context-library/
  scenarios/
    banking/          # 10+ scenarios (CBN, commercial banking)
    taxation/         # 10+ scenarios (FIRS, CITN)
    accounting/       # 10+ scenarios (ICAN standards)
    hr-management/    # 10+ scenarios (CIPM, labor law)
    insurance/        # 5+ scenarios
    general-business/ # 10+ scenarios
  negative-examples/
    cultural-mismatch.md    # Examples of what NOT to generate
    regulatory-errors.md    # Common AI mistakes in Nigerian regulatory content
  terminology/
    glossary.md             # Nigerian business terminology
    pidgin-terms.md         # Pidgin English professional terms
    regulatory-acronyms.md  # CBN, FIRS, SEC, NDIC, etc.
  regulatory-references/
    cbn-circulars.md        # Key CBN circulars and dates
    ican-standards.md       # ICAN pronouncements
    cipm-frameworks.md      # CIPM competency frameworks
    citn-guidelines.md      # CITN tax practice guidelines
    itf-regulations.md      # ITF levy rules and Form 7A
```

Minimum 50 vetted scenarios before the Day 25 pipeline test.

### 4.5 Quality Gates and Automated Validation

The validation_agent (Stage 5) runs automated checks on every generated course package:

| Check | Threshold | Action on Fail |
|-------|-----------|----------------|
| JSON schema validation | 100% conformance | Block: return to generator |
| All blocks have valid `difficulty_tier` | 100% | Block |
| Quiz items per lesson | >= 3, <= 5 | Block |
| Bloom taxonomy distribution | >= 40% at apply/analyze/evaluate/create | Warning |
| Quiz correct_answer_index valid | In range of options array | Block |
| Artifact prompt has evaluation_criteria | >= 3 criteria | Warning |
| Scenario has >= 2 decision_points | 100% | Warning |
| No empty content fields | 100% | Block |
| Text length per block | 100-800 words | Warning |
| Estimated duration reasonable | 5-20 minutes per lesson | Warning |
| Nigerian context fields populated | On Nigeria-specific courses | Warning |
| Regulatory references verifiable | Cross-check against context library | Warning |
| No hallucinated regulation numbers | Cross-check against known CBN/ICAN/CIPM refs | Block |
| Profanity/inappropriate content check | Zero matches | Block |
| Three difficulty variants present | All three for each lesson | Block |

**Three-tier SME review process:**

| Tier | Applied To | Time Per Course | Reviewer |
|------|-----------|----------------|----------|
| Automated | 100% of courses | 0 min (pipeline) | validation_agent |
| Lightweight | 80% of courses | 10-15 min checklist | Part-time Nigerian reviewer |
| Deep review | 20% of courses (sampled) | 45-60 min | Gbitse or domain SME |

---

## 5. Payment Architecture

### 5.1 Paystack Subscriptions API (B2C)

For individual recurring billing, Paystack manages the subscription lifecycle.

```ts
// payments/paystack-subscription.ts

// Create a plan (done once via admin)
const plan = await paystack.plan.create({
  name: 'SABIficate Standard Quarterly',
  amount: 650000,             // NGN 6,500 in kobo
  interval: 'quarterly',
  currency: 'NGN',
  invoice_limit: 0,           // No limit (auto-renew until cancelled)
});

// Initialize subscription (first payment)
const transaction = await paystack.transaction.initialize({
  email: user.email,
  amount: 650000,
  plan: plan.data.plan_code,
  callback_url: 'https://sabificate.com/payment/callback',
  metadata: {
    user_id: user.id,
    subscription_type: 'individual',
    plan_tier: 'standard',
  },
});
// Returns authorization_url -- redirect user to Paystack checkout

// After first successful charge, Paystack auto-debits on each cycle.
// BUT Paystack does NOT retry failed charges.
```

### 5.2 Paystack Recurring Charges (B2B Seat Licenses)

For corporate seat licenses, the platform controls billing timing and amounts.

```ts
// payments/corporate-billing.ts

// After initial authorization, store authorization_code
async function chargeCorporateSeat(org: Organization, seats: number, pricePerSeatKobo: number) {
  const totalKobo = seats * pricePerSeatKobo;

  const charge = await paystack.transaction.chargeAuthorization({
    authorization_code: org.paystack_auth_code,
    email: org.billing_email,
    amount: totalKobo,
    currency: 'NGN',
    metadata: {
      org_id: org.id,
      seats,
      billing_period: getCurrentBillingPeriod(),
      invoice_number: generateInvoiceNumber(),
    },
  });

  if (charge.data.status === 'success') {
    await recordPayment(org.id, charge.data);
    await sendReceipt(org.billing_email, charge.data);
  } else {
    await initiateDunningFlow(org.id, charge.data);
  }
}
```

### 5.3 Dunning Engine

Paystack does NOT auto-retry failed subscription charges. The dunning engine handles retries and notifications.

```
Failed Charge (webhook: invoice.payment_failed or charge.failed)
    |
    v
+-- T+0: Record failure. Send email + in-app notification.
|         "Your payment failed. Tap to update your card."
|         Access: FULL (grace period starts)
|
+-- T+24h: First retry via Paystack charge.
|           If success: done. If fail:
|           Send WhatsApp template message (pre-approved by Meta):
|           "Hi {name}, your SABIficate subscription payment failed.
|            Update your card here: {deep_link}"
|           Access: FULL
|
+-- T+72h: Second retry.
|           If success: done. If fail:
|           Send SMS: "SABIficate: Payment failed. Update card at {link}"
|           Send WhatsApp reminder.
|           Access: DEGRADED (can view completed content, cannot start new lessons)
|
+-- T+7d:  Third and final retry.
|           If success: done. If fail:
|           Send email: "Your subscription has been suspended."
|           Send WhatsApp: final notice.
|           Access: SUSPENDED (read-only: can view certificates and progress,
|                    cannot access lesson content)
|
+-- T+30d: Subscription cancelled. Data retained for 90 days per NDPA.
```

**Webhook flow:**

```ts
// routes/v1/payments.ts
fastify.post('/api/v1/payments/webhook/paystack', async (req, reply) => {
  // Verify webhook signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return reply.status(401).send();
  }

  const event = req.body as PaystackWebhookEvent;

  switch (event.event) {
    case 'charge.success':
      await handleSuccessfulCharge(event.data);
      break;
    case 'invoice.payment_failed':
      await dunningQueue.add('initiate', { data: event.data, attempt: 1 });
      break;
    case 'subscription.create':
      await handleNewSubscription(event.data);
      break;
    case 'subscription.disable':
      await handleSubscriptionCancelled(event.data);
      break;
    case 'transfer.success':
      await handleTransferSuccess(event.data);
      break;
  }

  return reply.status(200).send();
});
```

### 5.4 B2B Invoicing

```ts
// payments/invoice-generator.ts

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_ngn: number;
  total_ngn: number;
}

async function generateProformaInvoice(org: Organization, seats: number, plan: SubscriptionPlan): Promise<Invoice> {
  const lineItems: InvoiceLineItem[] = [
    {
      description: `SABIficate ${plan.name} - ${seats} seat license (${plan.billing_cycle})`,
      quantity: seats,
      unit_price_ngn: plan.price_ngn,
      total_ngn: seats * plan.price_ngn,
    },
  ];

  const subtotal = lineItems.reduce((sum, item) => sum + item.total_ngn, 0);
  const vatRate = 0.075; // 7.5% Nigerian VAT
  const vat = Math.round(subtotal * vatRate);
  const total = subtotal + vat;

  const invoice = await appDb.query(
    `INSERT INTO invoice (org_id, invoice_number, line_items_json, subtotal_ngn, tax_ngn, total_ngn,
     due_date, status, generated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'proforma', $8)
     RETURNING *`,
    [
      org.id,
      generateInvoiceNumber(), // SAB-2026-0001
      JSON.stringify(lineItems),
      subtotal,
      vat,
      total,
      addDays(new Date(), 30), // Net 30
      'system',
    ]
  );

  // Generate PDF via headless template
  const pdfUrl = await generateInvoicePDF(invoice.rows[0]);

  // Send via email
  await emailQueue.add('invoice', {
    to: org.billing_email,
    subject: `SABIficate Invoice ${invoice.rows[0].invoice_number}`,
    attachments: [{ filename: `${invoice.rows[0].invoice_number}.pdf`, url: pdfUrl }],
  });

  return invoice.rows[0];
}
```

**Invoice reconciliation (manual bank transfer):**
Corporate and government clients pay via bank transfer. An admin marks invoices as paid after reconciling against bank statements.

```
POST /api/v1/admin/invoices/{id}/mark-paid
{
  "payment_reference": "bank transfer ref",
  "amount_received_ngn": 1075000,
  "payment_date": "2026-07-15",
  "bank_name": "Zenith Bank",
  "notes": "Confirmed via Zenith statement"
}
```

### 5.5 PaymentTransaction Schema

```sql
CREATE TABLE payment_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "user"(id),     -- NULL for B2B org payments
  org_id UUID REFERENCES organization(id), -- NULL for B2C individual
  amount_kobo BIGINT NOT NULL,             -- Amount in kobo (NGN * 100)
  currency VARCHAR(3) DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
    'card', 'bank_transfer', 'ussd', 'direct_debit', 'manual'
  )),
  gateway VARCHAR(20) NOT NULL CHECK (gateway IN (
    'paystack', 'flutterwave', 'nibss', 'manual'
  )),
  gateway_reference VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'success', 'failed', 'refunded', 'partially_refunded'
  )),
  subscription_id UUID REFERENCES subscription(id),
  invoice_id UUID REFERENCES invoice(id),
  promo_code_id UUID REFERENCES promo_code(id),
  metadata_json JSONB DEFAULT '{}' CHECK (
    -- Constrained: only allow known keys
    metadata_json ?| ARRAY['plan_tier', 'billing_period', 'seats', 'dunning_attempt',
                           'refund_reason', 'original_transaction_id']
  ),
  failure_reason VARCHAR(255),
  refund_amount_kobo BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_user ON payment_transaction(user_id);
CREATE INDEX idx_payment_org ON payment_transaction(org_id);
CREATE INDEX idx_payment_status ON payment_transaction(status);
CREATE INDEX idx_payment_gateway_ref ON payment_transaction(gateway_reference);
CREATE INDEX idx_payment_created ON payment_transaction(created_at);
```

---

## 6. WhatsApp Integration

### 6.1 WhatsApp Business API Flow

SABIficate uses the WhatsApp Business API (Cloud API via Meta) for:
1. Daily micro-lesson delivery
2. Interactive button quizzes
3. Dunning payment reminders
4. Streak/engagement nudges

```
                +-----------------+
                | Meta Cloud API  |
                | (WhatsApp)      |
                +--------+--------+
                         |
           Webhook POST  |  Send API
                         v
              +----------+----------+
              | /api/v1/whatsapp/   |
              | webhook             |
              |                     |
              | Verify signature    |
              | Route by type:      |
              | - message received  |
              | - status update     |
              | - button click      |
              +----------+----------+
                         |
           +-------------+-------------+
           |             |             |
           v             v             v
    +------+----+  +-----+-----+  +---+-------+
    | Quiz      |  | Lesson    |  | Dunning   |
    | Response  |  | Delivery  |  | Templates |
    | Handler   |  | Scheduler |  |           |
    +-----------+  +-----------+  +-----------+
```

### 6.2 Micro-Lesson Delivery via WhatsApp

Daily lesson push (scheduled via BullMQ cron job):

```ts
// jobs/whatsapp-lesson.ts

// Message structure for a micro-lesson:
async function sendDailyLesson(subscription: WhatsAppSubscription) {
  const lesson = await getNextLessonForUser(subscription.user_id);

  // 1. Send lesson text (session message, free within 24h window)
  await whatsappApi.sendMessage({
    to: subscription.phone_number,
    type: 'text',
    text: {
      body: formatLessonForWhatsApp(lesson),
      // Max 4096 chars. Format:
      // *Today's Lesson: [Title]*
      // _[Category] | [Difficulty] | 5 min read_
      //
      // [300-word lesson content, markdown-lite]
      //
      // Key takeaway: [one sentence]
    },
  });

  // 2. Send quiz via interactive buttons
  await whatsappApi.sendMessage({
    to: subscription.phone_number,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: lesson.quizQuestion,
      },
      action: {
        buttons: lesson.quizOptions.map((opt, i) => ({
          type: 'reply',
          reply: {
            id: `quiz_${lesson.id}_${i}`,
            title: opt.text.substring(0, 20), // Button text max 20 chars
          },
        })),
      },
    },
  });

  // 3. Send artifact prompt
  await whatsappApi.sendMessage({
    to: subscription.phone_number,
    type: 'text',
    text: {
      body: `*Your Action Item:*\n\n${lesson.artifactPrompt}\n\nComplete this in the SABIficate app to earn your credential: ${lesson.deepLink}`,
    },
  });
}
```

### 6.3 Interactive Button Quizzes

When a user taps a quiz button, WhatsApp sends a webhook with the button ID:

```ts
// Process quiz answer from WhatsApp button click
async function handleQuizButtonClick(message: WhatsAppWebhookMessage) {
  const buttonId = message.interactive.button_reply.id;
  // Format: quiz_{lessonId}_{optionIndex}
  const [, lessonId, optionIndex] = buttonId.split('_');

  const lesson = await getLessonById(lessonId);
  const quiz = lesson.blocks.find(b => b.type === 'quiz_block') as QuizBlock;
  const isCorrect = parseInt(optionIndex) === quiz.correct_answer_index;

  // Send result
  await whatsappApi.sendMessage({
    to: message.from,
    type: 'text',
    text: {
      body: isCorrect
        ? `Correct! ${quiz.explanation}`
        : `Not quite. The answer is: ${quiz.options[quiz.correct_answer_index].text}\n\n${quiz.explanation}`,
    },
  });

  // Record in database
  await recordQuizAttempt(message.from, lessonId, parseInt(optionIndex), isCorrect);
}
```

### 6.4 Template Messages for Dunning

Pre-approved Meta WhatsApp templates (must be submitted and approved BEFORE launch):

| Template Name | Category | Content | Used For |
|--------------|----------|---------|----------|
| `payment_failed_1` | UTILITY | "Hi {{1}}, your SABIficate payment of {{2}} failed. Update your card: {{3}}" | T+0 notification |
| `payment_retry_reminder` | UTILITY | "Hi {{1}}, we'll retry your payment tomorrow. To avoid interruption, update your card now: {{2}}" | T+24h reminder |
| `payment_final_notice` | UTILITY | "Hi {{1}}, your SABIficate access will be suspended in 4 days. Pay now: {{2}}" | T+72h warning |
| `subscription_suspended` | UTILITY | "Hi {{1}}, your SABIficate subscription has been suspended. Reactivate: {{2}}" | T+7d suspension |
| `daily_lesson` | UTILITY | "Good morning {{1}}! Today's lesson: {{2}}. Start learning: {{3}}" | Daily lesson push |
| `streak_reminder` | UTILITY | "{{1}}, you're on a {{2}}-day streak! Don't break it -- today's lesson takes just 5 minutes: {{3}}" | Streak nudge |
| `course_complete` | UTILITY | "Congratulations {{1}}! You completed {{2}}. View your credential: {{3}}" | Completion |

### 6.5 Session vs Template Message Cost Model

| Message Type | Cost | When Used |
|-------------|------|-----------|
| Session message (user-initiated) | Free (within 24h window) | User replies to a message; bot responds freely for 24h |
| Template message (business-initiated) | ~$0.03-0.08 per message (varies by country, Utility category) | Opening a new conversation with user |
| Interactive button message | Free if within session window; template cost if opening | Quiz buttons, CTAs |

**Cost estimate at scale:**

| Users | Daily Lesson Templates | Dunning (5% fail rate) | Monthly WhatsApp Cost |
|-------|----------------------|----------------------|---------------------|
| 100 | 100/day x 30 = 3,000 | ~150 | ~$160-$250 |
| 1,000 | 1,000/day x 30 = 30,000 | ~1,500 | ~$1,600-$2,500 |
| 10,000 | 10,000/day x 30 = 300,000 | ~15,000 | ~$16,000-$25,000 |

**Cost mitigation:** Encourage users to open the app (converting to session messages). Use template messages only for daily lesson push and dunning. All quiz interactions within the 24h session window are free.

---

## 7. Security and Compliance

### 7.1 NDPA Privacy-by-Design Data Flow

All Claude API calls MUST strip PII before transmission. The Nigerian PostgreSQL stores full context; only anonymized data crosses borders.

```
Learner submits quiz / interacts with tutor
    |
    v
[PII Stripper Service]
    |-- Strip: name, email, phone, employee_id, organization name
    |-- Replace with: anonymous session token (e.g., "learner_a1b2c3")
    |-- Retain: course_id, lesson_id, difficulty_tier, quiz_answers,
    |           time_spent, topic_area
    |
    v
[Claude API Call]
    |-- System prompt includes anonymized context only
    |-- No PII in any prompt or response
    |
    v
[Response received]
    |
    v
[Store in Nigerian PostgreSQL]
    |-- Full context with PII associations
    |-- tutor_conversation table links anonymous token to user_id
    |-- user_id -> PII mapping ONLY in Nigerian database
```

**PII stripping implementation:**

```ts
// utils/pii-stripper.ts
interface PIIStripResult {
  cleanedText: string;
  sessionToken: string;
  strippedFields: string[];
}

function stripPII(text: string, user: UserPII): PIIStripResult {
  const sessionToken = generateAnonymousToken(user.id);
  let cleaned = text;
  const stripped: string[] = [];

  // Replace known PII
  const piiPatterns: [RegExp, string][] = [
    [new RegExp(escapeRegex(user.first_name), 'gi'), '[name]'],
    [new RegExp(escapeRegex(user.last_name), 'gi'), '[name]'],
    [new RegExp(escapeRegex(user.email), 'gi'), '[email]'],
    [new RegExp(escapeRegex(user.phone_number), 'gi'), '[phone]'],
    [/\b\d{10,11}\b/g, '[phone]'],                    // Nigerian phone patterns
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]'],  // Any email
    [/\bEMP[-/]?\d{3,10}\b/gi, '[employee_id]'],      // Employee ID patterns
  ];

  if (user.employee_id) {
    piiPatterns.push([new RegExp(escapeRegex(user.employee_id), 'gi'), '[employee_id]']);
  }

  for (const [pattern, replacement] of piiPatterns) {
    if (pattern.test(cleaned)) {
      stripped.push(replacement);
      cleaned = cleaned.replace(pattern, replacement);
    }
  }

  return { cleanedText: cleaned, sessionToken, strippedFields: stripped };
}
```

### 7.2 Three-Tier Consent System

| Tier | Consent Level | Data Usage | Required For |
|------|-------------|-----------|-------------|
| Tier 1: Essential | Accepted at registration | Course progress, quiz scores, credential issuance | Platform access (mandatory) |
| Tier 2: Anonymized Analytics | Opt-in (separate checkbox) | Aggregate learning patterns (cohort-level, no individual identification) | Corporate dashboard analytics |
| Tier 3: Behavioral Profiling | Explicit per-instance consent | Individual learning behavior patterns, AI tutor interaction analysis | Future: career insights, employer reports |

**Implementation:**

```sql
CREATE TABLE user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id),
  consent_tier INTEGER NOT NULL CHECK (consent_tier IN (1, 2, 3)),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  consent_text_version VARCHAR(10) NOT NULL,  -- e.g., "1.0", "1.1"
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Every consent change creates a new row (audit trail, never UPDATE)
CREATE INDEX idx_consent_user ON user_consent(user_id, consent_tier);
```

Learners MUST be able to use the full educational platform (Tier 1) WITHOUT opting into Tier 2 or Tier 3. Tier 2 and 3 are truly optional.

### 7.3 Content Security Policy Headers

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://js.paystack.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://cdn.sabificate.com https://*.r2.dev data:;
  font-src 'self';
  connect-src 'self' https://api.sabificate.com https://api.paystack.co wss://api.sabificate.com;
  frame-src https://checkout.paystack.com;
  media-src 'self' https://cdn.sabificate.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://checkout.paystack.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;

Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 7.4 Anti-Scraping Measures

| Measure | Implementation |
|---------|---------------|
| Rate limiting on course content endpoints | 30 req/min per user |
| Content served via authenticated API only | No publicly crawlable lesson pages |
| Lesson content NOT in initial HTML | Fetched via API after auth |
| Watermarking | User ID embedded invisibly in rendered lesson text (CSS technique) |
| Copy prevention | CSS `user-select: none` on lesson content (deterrent, not security) |
| Bot detection | Cloudflare Bot Management (included in Pro plan) |
| API token rotation | Access tokens expire every 15 minutes |

### 7.5 FCPA Audit Trail for Government Payments

All government-related transactions require an audit trail for FCPA compliance.

```sql
CREATE TABLE government_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organization(id),
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'outreach_initiated', 'meeting_held', 'proposal_submitted',
    'contract_signed', 'payment_received', 'service_delivered',
    'referral_fee_paid', 'gift_offered', 'gift_declined'
  )),
  description TEXT NOT NULL,
  counterparty_name VARCHAR(255),
  counterparty_title VARCHAR(255),
  counterparty_organization VARCHAR(255),
  amount_ngn BIGINT,                   -- NULL if not financial
  payment_transaction_id UUID REFERENCES payment_transaction(id),
  supporting_documents_json JSONB,     -- URLs to uploaded evidence
  recorded_by UUID NOT NULL REFERENCES "user"(id),
  reviewed_by UUID REFERENCES "user"(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zero tolerance: all government interactions logged
-- Referral fees for third-party introductions: acceptable (per founders' agreement)
-- Internal kickbacks: prohibited
```

---

## 8. Infrastructure and DevOps

### 8.1 Hetzner CX33 Setup

**Server specification:**
- Plan: CX33 (4 vCPU shared, 8GB RAM, 80GB NVMe, 20TB traffic)
- Location: Nuremberg, Germany
- OS: Ubuntu 24.04 LTS
- Cost: ~EUR 6.49/month (~$7)

**Software stack on CX33:**

```
Ubuntu 24.04 LTS
  |
  +-- Node.js 22 LTS (via nvm)
  |     +-- Fastify API server (PM2 managed, 2 instances)
  |
  +-- PostgreSQL 16
  |     +-- sabificate_app database
  |     +-- pgvector extension
  |
  +-- Redis 7
  |     +-- Sessions, cache, BullMQ queues
  |
  +-- Nginx (reverse proxy)
  |     +-- SSL terminated at Cloudflare; Nginx handles local routing
  |     +-- Proxy pass to Node.js on port 3000
  |
  +-- Certbot (Let's Encrypt for origin certificate, or Cloudflare Origin CA)
```

**PM2 configuration:**

```json
{
  "apps": [
    {
      "name": "sabificate-api",
      "script": "dist/server.js",
      "instances": 2,
      "exec_mode": "cluster",
      "max_memory_restart": "500M",
      "env": {
        "NODE_ENV": "production",
        "PORT": "3000"
      }
    }
  ]
}
```

### 8.2 Cloudflare Pro Configuration

**Monthly cost:** $20

**Cache Rules (replacing deprecated Page Rules):**

| Rule # | Match | Action | Purpose |
|--------|-------|--------|---------|
| 1 | URI path starts with `/api/auth` OR `/api/v1/admin` OR `/api/v1/learner` | Bypass cache | Never cache authenticated/sensitive routes |
| 2 | URI path matches `\.(js|css|woff2|svg|png|jpg|webp|avif|ico)$` | Cache Everything, Edge TTL 30 days, Browser TTL 1 year | Static assets (hashed filenames) |
| 3 | URI path starts with `/api/v1/courses` AND method is GET | Cache Everything, Edge TTL 1 hour, Browser TTL 1 minute | Course catalog (public) |

**Additional configuration:**
- SSL/TLS: Full (Strict) with Cloudflare Origin CA certificate
- HTTP/3 (QUIC): Enabled
- Brotli compression: Enabled
- Early Hints: Enabled
- Smart Tiered Cache: Enabled (free)
- Cloudflare Image Resizing: Enabled ($0.50/1K transformations)
- Bot Fight Mode: Enabled
- Browser Integrity Check: Enabled
- Hotlink Protection: Enabled

### 8.3 GLO Fallback Architecture

Globacom (12.34% market share, 22.5M subscribers) has documented connection timeout issues with Cloudflare-proxied servers.

**Architecture:**

```
GLO User
    |
    v
Cloudflare Worker (detects AS 37148/29465)
    |
    v
302 Redirect to glo.sabificate.com
    |
    v
DNS: glo.sabificate.com -> Hetzner CX23 IP (grey-cloud, DNS-only, no CF proxy)
    |
    v
Hetzner CX23 (~EUR 3.99/mo, 2 vCPU, 4GB RAM)
    +-- Nginx reverse proxy
    |     +-- proxy_pass to CX33 origin (internal Hetzner network, <1ms)
    |     +-- SSL via Let's Encrypt (not Cloudflare)
    |     +-- Static asset caching (local Nginx cache)
    +-- No Cloudflare proxy = no GLO timeout issues
```

**GLO detection in Cloudflare Worker:**

```ts
// GLO AS numbers: AS37148, AS29465
const GLO_ASN = new Set([37148, 29465]);

export default {
  async fetch(request: Request): Promise<Response> {
    const asn = (request as any).cf?.asn;
    if (asn && GLO_ASN.has(asn)) {
      const url = new URL(request.url);
      url.hostname = 'glo.sabificate.com';
      return Response.redirect(url.toString(), 302);
    }
    // Non-GLO: proceed normally
    return fetch(request);
  },
};
```

**Monitoring:** Check quarterly whether the GLO-Cloudflare issue has resolved. The council notes it largely resolved by mid-2028.

### 8.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run test:e2e

  build-and-audit:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

      # Performance budget enforcement
      - name: Check bundle sizes
        run: |
          CRITICAL_JS=$(find dist/assets -name '*.js' -exec gzip -c {} \; | wc -c)
          CSS_SIZE=$(find dist/assets -name '*.css' -exec gzip -c {} \; | wc -c)
          echo "Critical JS (gzip): $((CRITICAL_JS / 1024))KB"
          echo "CSS (gzip): $((CSS_SIZE / 1024))KB"
          if [ $CRITICAL_JS -gt 204800 ]; then
            echo "FAIL: Critical JS exceeds 200KB budget"
            exit 1
          fi
          if [ $CSS_SIZE -gt 15360 ]; then
            echo "FAIL: CSS exceeds 15KB budget"
            exit 1
          fi

      - name: Security audit
        run: npm audit --production --audit-level=high

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-audit
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: |
          # SSH to staging and pull + rebuild
          # Or use a webhook-based deploy trigger

  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-audit
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # SSH to CX33 and pull + rebuild + PM2 reload
          # Zero-downtime via PM2 cluster mode reload
```

### 8.5 Monitoring and Alerting

| Component | Tool | Purpose | Alert Threshold |
|-----------|------|---------|----------------|
| Uptime | UptimeRobot (free: 50 monitors) | HTTP health checks every 5 min | 2 consecutive failures |
| APM | Sentry (free tier: 5K errors/mo) | Error tracking, performance | Error rate >1% |
| Metrics | Prometheus + node-exporter | CPU, RAM, disk, request latency | CPU >80%, RAM >85%, disk >80% |
| Logs | Pino JSON -> stdout -> journald | Structured logging | Error-level log spike |
| Database | pg_stat_statements | Slow queries | Query >500ms |
| Redis | Redis INFO command (cron) | Memory, connections | Memory >80% |
| Cloudflare | Cloudflare Analytics (included) | Cache hit rate, bandwidth | Cache hit <85% |
| Payment | Custom dashboard | Failed payments, dunning state | Failed charge rate >10% |
| WhatsApp | Delivery receipts tracking | Message delivery rate | Delivery <90% |

**Health check endpoint:**

```ts
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  checks: {
    appDb: await checkAppDb(),
    piiDb: await checkPiiDb(),
    redis: await checkRedis(),
  },
}));
```

### 8.6 Backup Strategy

| Data | Method | Frequency | Retention | Location |
|------|--------|-----------|-----------|----------|
| App PostgreSQL (Hetzner) | pg_dump compressed | Daily at 02:00 UTC | 30 days | Hetzner Object Storage + R2 |
| PII PostgreSQL (Nigeria) | pg_dump compressed + encrypted | Daily at 02:00 WAT | 30 days | Same Nigerian host + encrypted backup to R2 |
| Redis | RDB snapshot | Every 6 hours | 7 days | Local disk + Hetzner Object Storage |
| R2 media assets | R2 versioning | Continuous | 90 days | R2 (inherent durability) |
| Application code | Git | Every push | Indefinite | GitHub |
| Environment variables | Encrypted backup | Weekly | 90 days | Hetzner Object Storage (encrypted) |

**Backup encryption:** PII database backups are encrypted with AES-256 before any cross-border transfer. The encryption key is stored separately from the backup.

**Restore testing:** Monthly restore test of a random backup to a temporary database instance. Document restore time and verify data integrity.

---

## 9. API Contract -- Phase 1 MVP Endpoints

All endpoints are REST, versioned at `/api/v1/`. Request and response bodies are JSON. Authenticated endpoints require `Authorization: Bearer <jwt>` header.

**Roles:** `learner`, `corporate_admin`, `platform_admin`

### 9.1 Authentication

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| POST | `/api/v1/auth/register` | None | `{ email, password, first_name, last_name, phone_number, consent_tier_1: true }` | `{ user_id, message }` | Creates user in Nigerian PII DB |
| POST | `/api/v1/auth/login` | None | `{ email, password, code_challenge, code_challenge_method: "S256" }` | `{ authorization_code }` | Rate limited: 5/15min per IP |
| POST | `/api/v1/auth/token` | None | `{ authorization_code, code_verifier }` | `{ access_token, token_type: "Bearer", expires_in: 900 }` + httpOnly refresh cookie | PKCE verification |
| POST | `/api/v1/auth/refresh` | Refresh cookie | (empty body) | `{ access_token, expires_in: 900 }` | Refresh token rotation |
| POST | `/api/v1/auth/logout` | Bearer | (empty body) | `{ message }` | Invalidates refresh token |
| POST | `/api/v1/auth/password/reset-request` | None | `{ email }` | `{ message }` | Always returns 200 (no email enumeration) |
| POST | `/api/v1/auth/password/reset` | None | `{ token, new_password }` | `{ message }` | Token from email link |

### 9.2 Course Catalog

| Method | Path | Auth | Request/Params | Response | Notes |
|--------|------|------|----------------|----------|-------|
| GET | `/api/v1/courses` | Optional | `?category=&difficulty=&search=&page=&limit=20&tier=data_saver` | `{ courses: Course[], total, page, pages }` | Public. Cached at edge 1hr |
| GET | `/api/v1/courses/:slug` | Optional | `?tier=data_saver` | `{ course: CourseDetail }` | Includes module list, duration, CPD hours |
| GET | `/api/v1/courses/:slug/modules/:moduleId/lessons/:lessonId` | Bearer | `?tier=data_saver&difficulty=intermediate` | `{ lesson: LessonContent }` | Returns JSON content blocks for specified tier and difficulty |

**Course response shape:**

```json
{
  "id": "uuid",
  "title": "Financial Reporting for Nigerian Banks",
  "slug": "financial-reporting-nigerian-banks",
  "description": "...",
  "thumbnail_url": "https://cdn.sabificate.com/courses/...",
  "category": { "id": "uuid", "name": "Banking & Finance", "slug": "banking-finance" },
  "difficulty_levels": ["beginner", "intermediate", "advanced"],
  "estimated_duration_minutes": 120,
  "cpd_hours": 2,
  "professional_body": "CIBN",
  "module_count": 6,
  "lesson_count": 18,
  "price_ngn": 0,
  "status": "published"
}
```

### 9.3 Learner Progress

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/learner/courses` | Bearer (learner) | `?status=active&page=&limit=` | `{ enrollments: EnrollmentWithProgress[] }` | Enrolled courses with progress % |
| GET | `/api/v1/learner/courses/:courseId/progress` | Bearer (learner) | -- | `{ course_progress: CourseProgress }` | Per-lesson progress breakdown |
| POST | `/api/v1/learner/lessons/:lessonId/progress` | Bearer (learner) | `{ progress_percent, time_spent_seconds, status, difficulty_tier }` | `{ progress: LearnerProgress }` | Upsert. Foreground sync target |
| POST | `/api/v1/learner/assessments/:assessmentId/submit` | Bearer (learner) | `{ answers_json, time_taken_seconds, attempt_number }` | `{ attempt: AssessmentAttempt, score_percent, passed }` | Records attempt, returns score |
| GET | `/api/v1/learner/dashboard` | Bearer (learner) | -- | `{ streak, xp_total, courses_in_progress, courses_completed, recent_activity[] }` | Learner home screen data |

### 9.4 Offline Sync

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| POST | `/api/v1/offline/sync` | Bearer (learner) | `{ progress: OfflineProgress[], quiz_answers: OfflineQuizAnswer[] }` | `{ synced: { progress: number, quizzes: number }, conflicts: Conflict[] }` | Batch sync endpoint |
| GET | `/api/v1/offline/download/:courseId` | Bearer (learner) | `?tier=data_saver` | `{ course: OfflineCoursePackage }` | Full course content for offline storage. Includes size estimate |

**Conflict resolution:** Server timestamp wins for completion status. Client `progress_percent` wins if higher than server value.

### 9.5 Corporate Admin

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/admin/dashboard/overview` | Bearer (corporate_admin) | `?period=30d` | `{ enrolled, active, completion_rate, assessment_avg, learning_hours, credentials_issued }` | Aggregate metrics |
| GET | `/api/v1/admin/dashboard/learners` | Bearer (corporate_admin) | `?department=&course=&page=&limit=` | `{ learners: LearnerSummary[], total }` | Per-learner progress view |
| POST | `/api/v1/admin/learners/bulk-upload` | Bearer (corporate_admin) | Multipart: CSV file (email, first_name, last_name, department, job_title, employee_id) | `{ job_id, total_rows, valid_rows, errors: ValidationError[] }` | Async processing via BullMQ |
| POST | `/api/v1/admin/learners/enroll` | Bearer (corporate_admin) | `{ user_ids: string[], course_ids: string[] }` | `{ enrollments_created: number }` | Bulk course enrollment |
| GET | `/api/v1/admin/seats/overview` | Bearer (corporate_admin) | -- | `{ seats_purchased, seats_used, seats_available, departments: DeptSeatAllocation[] }` | Seat management |

### 9.6 Compliance and Reporting

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/admin/compliance/itf-report` | Bearer (corporate_admin) | `?year=2026&quarter=Q2` | `{ report: ITFReport }` | ITF Form 7A-compatible training record |
| GET | `/api/v1/admin/compliance/cpd-report` | Bearer (corporate_admin) | `?user_id=&professional_body=CIBN` | `{ report: CPDReport }` | CPD hours by professional body |
| GET | `/api/v1/admin/reports/download` | Bearer (corporate_admin) | `?report_type=itf&format=csv&year=&quarter=` | CSV or PDF file | Direct download |
| POST | `/api/v1/admin/reports/schedule` | Bearer (corporate_admin) | `{ report_type, frequency: "monthly", recipients: string[] }` | `{ schedule_id }` | Scheduled email reports |

**ITF Report response shape:**

```json
{
  "organization": "Fidelity Bank Plc",
  "itf_registration_number": "ITF/LAG/xxxx",
  "reporting_period": "Q2 2026",
  "total_employees_trained": 10,
  "total_training_hours": 45.5,
  "courses": [
    {
      "title": "Anti-Money Laundering Compliance",
      "category": "Regulatory",
      "cpd_hours": 2,
      "employees_completed": 8,
      "completion_rate": 0.80,
      "avg_score_percent": 78
    }
  ],
  "per_employee_records": [
    {
      "employee_id": "EMP-001",
      "name": "Adaeze Okafor",
      "department": "Compliance",
      "courses_completed": 3,
      "total_hours": 6,
      "certifications_earned": 2
    }
  ]
}
```

### 9.7 Payments

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| POST | `/api/v1/payments/initialize` | Bearer | `{ plan_id, payment_method?: "card" }` | `{ authorization_url, reference }` | Redirects to Paystack checkout |
| POST | `/api/v1/payments/webhook/paystack` | Paystack signature | Paystack event payload | 200 OK | Webhook handler (see Section 5.3) |
| GET | `/api/v1/payments/verify/:reference` | Bearer | -- | `{ transaction: PaymentTransaction }` | Verify payment status |
| GET | `/api/v1/payments/history` | Bearer | `?page=&limit=` | `{ transactions: PaymentTransaction[], total }` | Payment history |
| POST | `/api/v1/admin/invoices/generate` | Bearer (corporate_admin) | `{ seats, plan_id }` | `{ invoice: Invoice, pdf_url }` | Generate proforma invoice |
| POST | `/api/v1/admin/invoices/:id/mark-paid` | Bearer (platform_admin) | `{ payment_reference, amount_received_ngn, payment_date }` | `{ invoice: Invoice }` | Manual reconciliation |

### 9.8 Subscriptions

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/plans` | None | -- | `{ plans: SubscriptionPlan[] }` | Public pricing page data |
| GET | `/api/v1/subscriptions/current` | Bearer | -- | `{ subscription: Subscription, plan: SubscriptionPlan }` | Current user subscription |
| POST | `/api/v1/subscriptions/cancel` | Bearer | `{ reason?: string }` | `{ subscription: Subscription }` | Cancel at period end |
| POST | `/api/v1/subscriptions/reactivate` | Bearer | -- | `{ subscription: Subscription }` | Reactivate cancelled sub |

### 9.9 Credentials

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/credentials` | Bearer (learner) | -- | `{ credentials: IssuedCredential[] }` | List earned credentials |
| GET | `/api/v1/credentials/:id` | Bearer (learner) | -- | `{ credential: IssuedCredential, verification_url, qr_code_url }` | Full credential detail |
| GET | `/api/v1/credentials/verify/:certificate_number` | None | -- | `{ valid: boolean, credential: PublicCredentialView }` | Public verification page |
| POST | `/api/v1/credentials/:id/share` | Bearer (learner) | `{ platform: "linkedin" \| "email" \| "whatsapp" }` | `{ share_url }` | Generate sharing link |

**Credential issuance is triggered automatically** when a learner completes all modules in a course AND submits a portfolio artifact (for courses that require one).

### 9.10 WhatsApp

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| POST | `/api/v1/whatsapp/subscribe` | Bearer (learner) | `{ phone_number, preferred_time: "08:00", timezone: "Africa/Lagos" }` | `{ subscription: WhatsAppSubscription }` | Opt-in to daily lessons |
| POST | `/api/v1/whatsapp/verify` | Bearer (learner) | `{ phone_number, otp_code }` | `{ verified: boolean }` | Verify phone ownership |
| POST | `/api/v1/whatsapp/unsubscribe` | Bearer (learner) | -- | `{ message }` | Opt-out |
| POST | `/api/v1/whatsapp/webhook` | Meta signature | Meta webhook payload | 200 OK | Handles incoming messages, button clicks, delivery receipts |

### 9.11 Content Tier and Settings

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/api/v1/settings` | Bearer | -- | `{ content_tier, language, notifications, theme }` | User preferences |
| PUT | `/api/v1/settings` | Bearer | `{ content_tier?: "full" \| "data_saver" \| "ultra_light", language?: "en" }` | `{ settings: UserSettings }` | Update preferences |
| GET | `/api/v1/storage/status` | Bearer | -- | `{ used_bytes, quota_bytes, courses_downloaded: DownloadedCourse[] }` | Storage dashboard data |
| DELETE | `/api/v1/storage/courses/:courseId` | Bearer | -- | `{ freed_bytes }` | Remove downloaded course |

---

## Appendix A: Database Schema Summary

### Hetzner Nuremberg (App Database)

```sql
-- Core content
course, course_category, module, lesson, lesson_media

-- Enrollment and billing
enrollment, subscription, subscription_plan, payment_transaction,
invoice, promo_code

-- Organization
organization, department

-- Credentials
credential_template, issued_credential, badge, badge_award

-- Gamification
xp_transaction

-- Cohort (Phase 1b+)
cohort, pod, cohort_enrollment

-- AI pipeline
tutor_knowledge_base (document metadata and embeddings via pgvector)

-- WhatsApp
whatsapp_template

-- Compliance
government_audit_log
```

### Nigerian PostgreSQL (PII Database)

```sql
-- User identity
"user" (id, email, phone_number, password_hash, first_name, last_name,
        avatar_url, role, org_id, department_id, employee_id,
        language_preference, timezone, status, last_login_at)

-- Learning behavior (linked to user)
learner_progress, assessment_attempt

-- AI tutor (contains personal context)
tutor_conversation, tutor_message

-- Engagement patterns
streak

-- Consent records
user_consent

-- WhatsApp PII
whatsapp_subscription, whatsapp_message

-- Sync queue
offline_progress_queue
```

---

## Appendix B: Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.sabificate.com

# App Database (Hetzner)
APP_DB_HOST=localhost
APP_DB_PORT=5432
APP_DB_NAME=sabificate_app
APP_DB_USER=sabificate
APP_DB_PASSWORD=<secret>

# PII Database (Nigeria)
PII_DB_HOST=<nigerian-host>
PII_DB_PORT=5432
PII_DB_NAME=sabificate_pii
PII_DB_USER=sabificate_pii
PII_DB_PASSWORD=<secret>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<secret>

# Auth
JWT_SECRET=<256-bit-secret>
BCRYPT_COST=12

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_<key>
PAYSTACK_SECRET_KEY=sk_live_<key>

# Anthropic (AI)
ANTHROPIC_API_KEY=<key>

# WhatsApp Business API
WHATSAPP_API_TOKEN=<token>
WHATSAPP_PHONE_NUMBER_ID=<id>
WHATSAPP_VERIFY_TOKEN=<webhook-verify-token>

# Cloudflare
CLOUDFLARE_R2_ACCESS_KEY=<key>
CLOUDFLARE_R2_SECRET_KEY=<key>
CLOUDFLARE_R2_BUCKET=sabificate-media
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Email
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASSWORD=<password>
```

---

## Appendix C: Phase 1 MVP Feature-to-Endpoint Map

| Feature | Endpoints Used |
|---------|---------------|
| 1.1 Lesson Player | `GET /courses/:slug/modules/:mid/lessons/:lid`, `POST /learner/lessons/:lid/progress`, `POST /learner/assessments/:aid/submit` |
| 1.2 Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/token`, `POST /auth/refresh`, `POST /auth/logout` |
| 1.3 Course Catalog | `GET /courses`, `GET /courses/:slug` |
| 1.4 Progress Tracking | `GET /learner/courses`, `GET /learner/courses/:cid/progress`, `GET /learner/dashboard` |
| 1.5 Offline Sync | `POST /offline/sync`, `GET /offline/download/:courseId` |
| 1.6 Corporate Admin | `GET /admin/dashboard/overview`, `GET /admin/dashboard/learners`, `POST /admin/learners/bulk-upload`, `POST /admin/learners/enroll`, `GET /admin/seats/overview` |
| 1.7 Compliance Reports | `GET /admin/compliance/itf-report`, `GET /admin/compliance/cpd-report`, `GET /admin/reports/download` |
| 1.8 Payments | `POST /payments/initialize`, `POST /payments/webhook/paystack`, `GET /payments/verify/:ref`, `POST /admin/invoices/generate`, `POST /admin/invoices/:id/mark-paid` |
| 1.9 WhatsApp | `POST /whatsapp/subscribe`, `POST /whatsapp/verify`, `POST /whatsapp/webhook` |
| 1.10 Content Pipeline | (CLI/scripts, no API endpoints in Phase 1) |
| 1.11 Data Saver Mode | `GET /settings`, `PUT /settings`, `GET /storage/status`, `DELETE /storage/courses/:courseId` |
| 1.12 Credentials | `GET /credentials`, `GET /credentials/:id`, `GET /credentials/verify/:cert_number`, `POST /credentials/:id/share` |

**Total distinct endpoints (Phase 1 MVP): 38**
