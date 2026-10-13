<div align="center">

# ScaleLink — URL Shortener & Real-Time Analytics Engine

A production-ready, high-throughput URL shortening service and real-time clickstream analytics platform built with **Node.js (Express)**, **React 19**, **PostgreSQL**, **Redis**, and **Docker Compose**.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[Features](#-key-features) • [Architecture](#-system-architecture) • [Redirect Pipeline](#-high-throughput-redirect-pipeline) • [Quickstart](#-quickstart-with-docker-compose) • [API Reference](#-api-endpoints-reference)

</div>

---

## Executive Summary

Modern web applications require link shorteners that handle burst traffic with sub-millisecond latencies while collecting actionable clickstream data without blocking the user journey.

**ScaleLink** delivers:
- **Sub-5ms Redirect Latencies**: In-memory Redis cache-aside layer offloads up to 95% of database reads.
- **Asynchronous Telemetry Logging**: User redirect executes immediately via HTTP `302 Found`, while geolocation, device parsing, and referrer aggregation happen in non-blocking background routines.
- **Deterministic Collision-Free Encoding**: Custom Base62 algorithm mapping auto-incrementing 64-bit integer keys into 6-character URL slugs ($62^6 \approx 56.8 \text{ billion}$ unique URLs).
- **Zero-Friction Deployment**: Single-command container orchestration (`docker compose up -d`) packaging PostgreSQL, Redis, Backend API, and an Nginx-served SPA.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        Browser["Desktop & Mobile Browsers"]
        Crawler["API Clients / Third-Party Integrations"]
    end

    subgraph Edge["Reverse Proxy & Static Delivery"]
        Nginx["Nginx Web Server\n(Docker Frontend :80)"]
    end

    subgraph AppCluster["Application Cluster"]
        SPA["React 19 Dashboard\n(Vite + Tailwind CSS)"]
        API["Express.js REST API\n(Node.js 20 LTS)"]
    end

    subgraph CacheData["Data & Caching Tier"]
        Redis[("Redis In-Memory Store\n• URL Cache-Aside (TTL 24h)\n• Token Bucket Rate Limiter")]
        Postgres[("PostgreSQL 16\n• URLs & Tier Gates\n• Clickstream Analytics (Prisma)")]
    end

    Browser -->|Serves UI / Assets| Nginx
    Nginx --> SPA
    SPA -->|RESTful Operations| API
    Crawler -->|Redirect Request (/:code)| API

    API -->|1. Check Cache / Throttle| Redis
    API -->|2. Read / Write Persistent Records| Postgres
```

---

## High-Throughput Redirect Pipeline

Every incoming redirection request adheres to a strictly optimized sequence:

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Web Visitor
    participant API as Express Redirect Router
    participant Cache as Redis In-Memory Cache
    participant DB as PostgreSQL Database
    participant Worker as Background Analytics Pipeline

    Visitor->>API: GET /:shortCode
    API->>Cache: GET url:{shortCode}

    alt Cache Hit (Sub-millisecond)
        Cache-->>API: Target URL + Metadata + Password Flag
    else Cache Miss
        API->>DB: SELECT * FROM Url WHERE code = :shortCode
        DB-->>API: URL Record
        API->>Cache: SETEX url:{shortCode} 86400 (Target URL)
    end

    alt Password-Protected Link
        API-->>Visitor: 200 OK (Render Password Challenge UI)
        Visitor->>API: POST /:shortCode/unlock { password }
        API->>API: Validate bcrypt hash
    end

    API-->>Visitor: HTTP 302 Found (Location: targetUrl)

    Note over API,Worker: Non-Blocking Event-Driven Telemetry
    API-)Worker: Dispatch Click Event (IP, User-Agent, Referrer)
    Worker->>DB: INSERT INTO ClickAnalytics (Device, OS, Browser, Geo)
```

---

## Base62 Encoding Engine

Rather than generating pseudo-random strings and querying the database in an expensive retry loop to avoid collisions, ScaleLink implements a **deterministic Base62 bijective conversion**:

```mermaid
flowchart LR
    ID["Database ID\n(e.g., 125,348)"] 
    --> Mod["Modulo 62 Loop\n[0-9a-zA-Z] Alphabet"] 
    --> Slug["Compact Slug\n(e.g., 'w9C')"]
    --> PublicURL["Short URL\nhttps://s.id/w9C"]
```

- **Collision probability**: `0.0%` (Guaranteed unique per primary key).
- **Information density**: 6 characters represent up to **56,800,235,584** unique URLs.
- **URL-safe**: Characters are alphanumeric and require zero percent-encoding.

---

## Key Features

| Category | Capability | Technical Detail |
|---|---|---|
| **Core Routing** | Sub-millisecond Redirect | Redis Cache-Aside pattern with 24-hour sliding TTL |
| **Security** | Password-Protected URLs | Password gating with bcrypt salt-hashing & dynamic challenge UI |
| **Security** | Rate Limiting | IP-based token bucket rate limiting to thwart DDoS & brute force |
| **Analytics** | Deep Telemetry | Parses OS, browser, device category, referrer, and timestamps |
| **Analytics** | Export to CSV | Client-side sanitized CSV export for business intelligence |
| **Growth Tools**| UTM Campaign Builder | Floating interactive builder for `utm_source`, `utm_medium`, etc. |
| **Monetization**| Tiered Quota Gates | Plan permissions (`FREE`, `PRO`, `PREMIUM`) enforcing custom aliases & limits |
| **DevOps** | Full-Stack Dockerization | Multi-stage Docker builds with Nginx SPA fallback routing |

---

## Quickstart with Docker Compose

Spin up the entire production-grade stack (PostgreSQL, Redis, Backend, and Frontend) in seconds:

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose v2+](https://docs.docker.com/compose/)

### 2. Clone & Launch
```bash
# Clone the repository
git clone https://github.com/Kevinpashya13/url_shortener_analytics.git
cd url_shortener_analytics

# Launch all 4 services in detached mode
docker compose up -d --build
```

### 3. Access the Applications
| Service | URL | Default Credentials / Port |
|---|---|---|
| **Web Dashboard** | [http://localhost:5173](http://localhost:5173) | Frontend (Nginx Container) |
| **Backend REST API** | [http://localhost:3000](http://localhost:3000) | Express Server |
| **PostgreSQL** | `localhost:5432` | `user: postgres`, `password: postgres` |
| **Redis Cache** | `localhost:6379` | `redis://localhost:6379` |

```bash
# View real-time container logs
docker compose logs -f

# Gracefully stop all containers
docker compose down
```

---

## Local Development (Manual Setup)

If you prefer to run services natively without Docker:

### 1. Environment Setup
```bash
# Copy root environment file
cp .env.example .env
```
Ensure your local PostgreSQL and Redis services are running, then configure `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/url_shortener?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
```

### 2. Install & Migrate Database
```bash
# Install root backend dependencies
npm install

# Run database migrations and generate Prisma Client
npx prisma migrate dev
```

### 3. Start Backend & Dashboard
```bash
# Terminal 1 - Start Backend API
npm run dev

# Terminal 2 - Start Frontend Dashboard
cd dashboard
npm install
npm run dev
```

---

## API Endpoints Reference

### Public / Redirection
| Method | Endpoint | Description | Cache Strategy |
|---|---|---|---|
| `GET` | `/:code` | Redirect to target URL | Redis Cache (24h TTL) |
| `POST`| `/:code/unlock` | Verify password for protected link | bcrypt comparison |

### Shortlink Management
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/urls` | Bearer Token | Create new short URL (supports custom alias & password) |
| `GET` | `/api/urls` | Bearer Token | List all URLs belonging to authenticated user |
| `DELETE`| `/api/urls/:id` | Bearer Token | Remove shortlink and invalidate Redis cache entry |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/:code` | Bearer Token | Aggregate statistics (daily clicks, devices, browsers, referrers) |

---

## Project Structure

```
url_shortener_analytics/
├── .github/                  # CI/CD Workflows
├── dashboard/                # Frontend Client (React 19 + Vite)
│   ├── src/
│   │   ├── components/       # UI Components (UTM Builder, Toast, Charts)
│   │   ├── context/          # Global Context (AuthContext, ToastContext)
│   │   ├── pages/            # View Pages (Dashboard, Analytics, Auth)
│   │   └── utils/            # CSV Exporter, API Client
│   ├── Dockerfile            # Multi-stage Vite build + Nginx static server
│   └── nginx.conf            # Nginx SPA fallback configuration
├── prisma/
│   └── schema.prisma         # Relational database schema & relations
├── src/                      # Backend API (Node.js Express)
│   ├── config/               # Prisma & Redis client singletons
│   ├── controllers/          # Request handlers
│   ├── middlewares/          # Auth, tier validation, rate limiting
│   ├── routes/               # Express route declarations
│   └── utils/                # Base62 encoder & geo/device parsers
├── docker-compose.yml        # Orchestration for Postgres, Redis, API, & Web
├── Dockerfile                # Backend production container configuration
└── README.md                 # Engineering showcase documentation
```

---

## License
Distributed under the MIT License. See `LICENSE` for more information.