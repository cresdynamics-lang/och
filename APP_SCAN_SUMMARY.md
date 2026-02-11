# Ongoza CyberHub - Complete Application Scan Summary

**Date:** February 9, 2026  
**Application Type:** Full-Stack Cybersecurity Talent Development Platform

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.4
- **TypeScript:** 5.0+
- **Styling:** Tailwind CSS 3.3.0
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Animations:** Framer Motion 12.23.26
- **State Management:** Zustand 5.0.9, TanStack Query 5.90.16
- **Data Fetching:** SWR 2.4.0, Axios 1.13.2
- **Database Client:** Prisma 7.2.0
- **Authentication:** Supabase SSR 0.8.0
- **Charts:** Recharts 2.15.4
- **Drag & Drop:** @dnd-kit/core 6.3.1

**Backend:**
- **Django:** 4.2+ (Main API)
- **FastAPI:** 0.104.0 (AI/ML Services)
- **Database:** PostgreSQL (Relational + Vector with pgvector)
- **Cache:** Redis 7
- **ORM:** Django ORM + SQLAlchemy (FastAPI)
- **Authentication:** JWT (djangorestframework-simplejwt)
- **API Docs:** drf-spectacular (Django), OpenAPI (FastAPI)

**Infrastructure:**
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **Deployment:** PM2 (ecosystem.config.js)
- **Monitoring:** Prometheus

---

## 📁 Project Structure

```
ongozacyberhub/
├── frontend/nextjs_app/          # Next.js frontend application
│   ├── app/                      # Next.js App Router pages (409 .tsx files)
│   ├── components/               # React components (285 .tsx files)
│   │   ├── admin/               # Admin dashboard components
│   │   ├── analyst/             # Analyst dashboard components
│   │   ├── coaching/            # AI coaching components
│   │   ├── community/           # Community features
│   │   ├── curriculum/          # Learning curriculum components
│   │   ├── director/            # Program director components
│   │   ├── mentor/              # Mentor dashboard components
│   │   ├── missions/            # Mission system components
│   │   ├── recipes/             # Recipe engine components
│   │   ├── sponsor/             # Sponsor/employer components
│   │   ├── student/             # Student dashboard components
│   │   └── ui/                  # shadcn/ui base components (85 files)
│   ├── hooks/                   # Custom React hooks (64 files)
│   ├── lib/                     # Utility libraries (38 files)
│   ├── services/                # API client services (30+ clients)
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
│
├── backend/
│   ├── django_app/              # Django main application
│   │   ├── users/               # User management & authentication
│   │   ├── organizations/       # Organization management
│   │   ├── programs/             # Programs, tracks, cohorts
│   │   ├── curriculum/          # Curriculum engine
│   │   ├── missions/             # Mission system
│   │   ├── recipes/              # Recipe engine
│   │   ├── coaching/            # Coaching OS
│   │   ├── profiler/            # AI profiling system
│   │   ├── foundations/         # Foundations orientation tier
│   │   ├── mentorship/          # Mentorship coordination
│   │   ├── mentors/             # Mentor management
│   │   ├── sponsor_dashboard/   # Sponsor dashboard APIs
│   │   ├── sponsors/             # Sponsor/employer APIs
│   │   ├── director_dashboard/   # Director dashboard APIs
│   │   ├── marketplace/         # Talent marketplace
│   │   ├── community/           # Community features
│   │   ├── subscriptions/       # Subscription management
│   │   ├── progress/            # Progress tracking
│   │   ├── student_dashboard/   # Student dashboard cache
│   │   └── talentscope/        # Talent analytics
│   │
│   └── fastapi_app/             # FastAPI AI/ML services
│       ├── routers/v1/          # API routes
│       │   ├── profiling.py    # AI profiling endpoints
│       │   ├── recommendations.py  # Recommendation engine
│       │   ├── embeddings.py    # Vector embeddings
│       │   ├── personality.py   # Personality analysis
│       │   ├── missions.py      # Mission AI features
│       │   ├── curriculum.py    # Curriculum AI
│       │   ├── coaching.py     # Coaching AI
│       │   └── dashboard.py     # Dashboard AI
│       ├── services/            # Business logic
│       ├── models/              # Database models
│       ├── schemas/             # Pydantic schemas
│       └── vector_store/        # Vector DB clients (pgvector/pinecone)
│
├── deploy/                      # Deployment scripts & configs
├── docker/                      # Docker configurations
├── nginx/                       # Nginx configurations
├── scripts/                     # Utility scripts
└── docs/                        # Documentation

```

---

## 👥 User Roles & Personas

The platform supports **7 distinct user roles**:

1. **Student/Mentee** (`/dashboard/student`)
   - Learning path, missions, progress tracking
   - AI profiling & track recommendations
   - Foundations orientation
   - Coaching OS (habits, goals, reflections)
   - Recipe library access
   - Marketplace profile

2. **Mentor** (`/dashboard/mentor`)
   - Mentee management
   - Work queue & session scheduling
   - Mission review & feedback
   - Analytics dashboard
   - Messaging system

3. **Program Director** (`/dashboard/director`)
   - Program & track creation
   - Cohort management & lifecycle
   - Enrollment approval
   - Mentor assignment
   - Analytics & reporting
   - Calendar management
   - Certificate management

4. **Admin** (`/dashboard/admin`)
   - Full platform management
   - User management
   - Recipe editor & LLM tools
   - System configuration

5. **Sponsor/Employer** (`/dashboard/sponsor`)
   - Talent marketplace access
   - ROI dashboard
   - Cohort analytics
   - Employee management
   - Talent shortlisting

6. **Analyst** (`/dashboard/analyst`)
   - Platform analytics
   - Data sources management
   - Lab panel & SIEM tools
   - Learning content panel
   - Threat intel feeds

7. **Finance** (`/dashboard/finance`)
   - Billing & subscriptions
   - Revenue tracking
   - Invoice management

---

## 🔑 Core Features & Modules

### 1. **AI Profiling System** (Tier 0)
- **Location:** FastAPI (`/api/v1/profiling`)
- **Purpose:** 7-module comprehensive profiling system
- **Modules:**
  1. Identity & Value (VIP-based questions)
  2. Cyber Aptitude (logic, patterns, reasoning)
  3. Technical Exposure (multiple-choice & experience scoring)
  4. Scenario Preferences (choose-your-path mini-stories)
  5. Work Style & Behavioral Profile
  6. Difficulty Level Self-Selection (with AI verification)
  7. Role Fit Reflection (open-ended, stored as portfolio entry)
- **Output:** Maps users to 5 cybersecurity tracks (SOCDEFENSE, DFIR, etc.)

### 2. **Foundations Orientation** (Tier 1)
- **Location:** Django (`/api/v1/foundations`)
- **Purpose:** Mandatory orientation modules before full dashboard access
- **Content Types:** Video, Interactive, Assessment, Reflection
- **Tracking:** Module completion, timestamps, progress

### 3. **Recipe Engine**
- **Location:** Django (`/api/v1/recipes`)
- **Purpose:** Micro-skill delivery system (15-30min learning units)
- **Features:**
  - Step-by-step procedures
  - Track & skill code tagging
  - Difficulty levels (beginner/intermediate/advanced)
  - Prerequisites & validation checks
  - Mentor curation
  - Usage analytics

### 4. **Mission System**
- **Location:** Django (`/api/v1/missions`)
- **Purpose:** Hands-on cybersecurity challenges
- **Features:**
  - Mission execution & submission
  - Artifact collection
  - Mentor review workflow
  - Community integration
  - Recipe recommendations

### 5. **Coaching OS**
- **Location:** Django (`/api/v1/coaching`)
- **Purpose:** Personal development & habit tracking
- **Features:**
  - Habit tracking & streaks
  - Goal setting & completion
  - Reflection journals with sentiment analysis
  - AI coach recommendations
  - Progress metrics

### 6. **Curriculum Engine**
- **Location:** Django (`/api/v1/curriculum`)
- **Purpose:** Structured learning paths
- **Features:**
  - Track-based learning
  - Module & recipe sequencing
  - Progress tracking
  - Mentor notes
  - AI coach integration

### 7. **Mentorship Coordination**
- **Location:** Django (`/api/v1/mentorship`)
- **Purpose:** Mentor-mentee matching & coordination
- **Features:**
  - Automated matching algorithm
  - Session scheduling
  - Work queue management
  - Real-time coordination (SSE)
  - Feedback system

### 8. **Talent Marketplace**
- **Location:** Django (`/api/v1/marketplace`)
- **Purpose:** Connect students with employers
- **Features:**
  - Student profiles & portfolios
  - Job matching
  - Sponsor shortlisting
  - Talent analytics

### 9. **Community Module**
- **Location:** Django (`/api/v1/community`)
- **Purpose:** Social learning & collaboration
- **Features:**
  - Channels & spaces
  - Posts & discussions
  - Squads (study groups)
  - Events & announcements
  - Leaderboards & reputation
  - AI summarization

### 10. **Subscription & Billing**
- **Location:** Django (`/api/v1/subscriptions`, `/api/v1/billing`)
- **Purpose:** Subscription management & payments
- **Features:**
  - Plan management
  - Payment processing (Stripe)
  - Invoice generation
  - Seat entitlements

### 11. **Analytics & Reporting**
- **Location:** Django (`/api/v1/analytics`, `/api/v1/talentscope`)
- **Purpose:** Platform-wide analytics
- **Features:**
  - Student readiness scores
  - Skill heatmaps
  - ROI tracking (sponsors)
  - Progress analytics
  - PDF report generation

---

## 🗄️ Database Architecture

### PostgreSQL (Relational - Django)
**Key Models:**
- `users.User` - Enhanced user model with ABAC attributes
- `programs.Program` - Program definitions
- `programs.Track` - Learning tracks
- `programs.Cohort` - Student cohorts
- `programs.Enrollment` - Enrollment management
- `recipes.Recipe` - Recipe library
- `missions.Mission` - Mission definitions
- `coaching.*` - Coaching OS models (habits, goals, sessions)
- `profiler.*` - Profiling session tracking
- `foundations.*` - Foundations modules & progress
- `mentorship.*` - Mentorship coordination
- `marketplace.*` - Talent marketplace
- `subscriptions.*` - Subscription management
- `progress.*` - Progress tracking
- `student_dashboard.StudentDashboardCache` - Denormalized cache

### PostgreSQL Vector (FastAPI)
- Embeddings storage (pgvector extension)
- Vector similarity search
- Alternative: Pinecone support

### Redis
- Session caching
- API response caching
- Real-time coordination data

---

## 🔌 API Architecture

### Django REST API (`/api/v1/`)
**Main Endpoints:**
- `/api/v1/auth/*` - Authentication & user management
- `/api/v1/users/*` - User CRUD operations
- `/api/v1/programs/*` - Program & cohort management
- `/api/v1/curriculum/*` - Curriculum engine
- `/api/v1/recipes/*` - Recipe engine
- `/api/v1/missions/*` - Mission system
- `/api/v1/coaching/*` - Coaching OS
- `/api/v1/profiler/*` - Profiling status (sync with FastAPI)
- `/api/v1/foundations/*` - Foundations orientation
- `/api/v1/mentorship/*` - Mentorship coordination
- `/api/v1/director/*` - Director dashboard
- `/api/v1/sponsor/*` - Sponsor dashboard
- `/api/v1/marketplace/*` - Talent marketplace
- `/api/v1/community/*` - Community features
- `/api/v1/subscriptions/*` - Subscription management
- `/api/v1/analytics/*` - Analytics & reporting
- `/api/v1/talentscope/*` - Talent analytics

### FastAPI AI API (`/api/v1/`)
**Main Endpoints:**
- `/api/v1/profiling/*` - AI profiling service
- `/api/v1/recommendations/*` - Recommendation engine
- `/api/v1/embeddings/*` - Vector embeddings
- `/api/v1/personality/*` - Personality analysis
- `/api/v1/missions/*` - Mission AI features
- `/api/v1/curriculum/*` - Curriculum AI
- `/api/v1/coaching/*` - Coaching AI
- `/api/v1/dashboard/*` - Dashboard AI

---

## 🎨 Frontend Architecture

### Routing Structure (Next.js App Router)
```
/                           # Landing page
/login/[role]              # Role-based login
/signup/[role]             # Role-based signup
/onboarding/ai-profiler    # Tier 0 profiling
/dashboard/student/*       # Student dashboard
/dashboard/mentor/*         # Mentor dashboard
/dashboard/director/*       # Director dashboard
/dashboard/admin/*          # Admin dashboard
/dashboard/sponsor/*        # Sponsor dashboard
/dashboard/analyst/*        # Analyst dashboard
/dashboard/finance/*        # Finance dashboard
```

### State Management
- **Zustand Stores:**
  - `dashboardStore.ts` - Dashboard state
  - `directorStore.ts` - Director-specific state
- **TanStack Query:** Server state & caching
- **SWR:** Additional data fetching

### Component Architecture
- **shadcn/ui Base Components:** 85+ reusable UI components
- **Feature Components:** Role-specific dashboard components
- **Layout Components:** Role-based layouts with navigation
- **Animation:** Framer Motion for micro-interactions

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. User selects role → `/login/[role]`
2. Credentials submitted → Next.js API route
3. Forwarded to Django → `POST /api/v1/auth/login`
4. JWT tokens returned → Stored in cookies
5. Role-based redirect → Dashboard

### Authorization
- **ABAC (Attribute-Based Access Control)** in User model
- Role-based route guards
- API-level permission checks
- Onboarding flow guards (profiling → foundations → dashboard)

---

## 🚀 Deployment Architecture

### Docker Compose Services
1. **Nginx** - Reverse proxy (port 80)
2. **PostgreSQL Relational** - Django database
3. **PostgreSQL Vector** - FastAPI vector database
4. **Redis** - Caching & sessions
5. **Django** - Main API (port 8000)
6. **FastAPI** - AI services (port 8001)
7. **Next.js** - Frontend (port 3000)

### Production Deployment
- **PM2:** Process management (`ecosystem.config.js`)
- **Nginx:** Reverse proxy configuration
- **SSL:** Setup scripts available
- **Deployment Scripts:** Multiple deployment automation scripts

---

## 📊 Key Integrations

### AI/LLM Services
- **Anthropic Claude** (`@anthropic-ai/sdk`)
- **OpenAI** (backend)
- **Groq SDK** (frontend)
- **Ollama** (local LLM support)

### External Services
- **Supabase** - Authentication & database
- **Stripe** - Payment processing
- **Resend** - Email service
- **Prometheus** - Metrics & monitoring

---

## 📈 Performance Optimizations

### Frontend
- **Next.js Standalone Output** - Optimized builds
- **React Memoization** - Component memoization
- **Code Splitting** - Route-based splitting
- **Image Optimization** - Next.js Image component
- **SWR/TanStack Query** - Intelligent caching

### Backend
- **Student Dashboard Cache** - Denormalized cache table
- **Redis Caching** - API response caching
- **Database Indexing** - Strategic indexes on frequently queried fields
- **Connection Pooling** - Database connection optimization

---

## 🧪 Testing

### Backend Tests
- **Location:** `backend/django_app/tests/`
- **Frameworks:** pytest, pytest-django
- **Coverage:** API endpoints, models, serializers
- **Test Files:**
  - `test_auth_endpoints.py`
  - `test_programs_endpoints.py`
  - `test_missions_endpoints.py`
  - `test_coaching_endpoints.py`
  - And more...

---

## 📝 Documentation

### Key Documentation Files
- `FRONTEND_UI_FLOW_GUIDE.md` - User flow documentation
- `STUDENT_ONBOARDING_FLOW_ANALYSIS.md` - Onboarding flow
- `DIRECTOR_IMPLEMENTATION.md` - Director features
- `MENTOR_SYSTEM_GUIDE.md` - Mentorship system
- `DOCKER_SETUP.md` - Docker setup guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `PRODUCTION_READINESS_CHECKLIST.md` - Production checklist

### API Documentation
- **Django:** `/api/schema/swagger-ui/` (drf-spectacular)
- **FastAPI:** `/docs` (OpenAPI/Swagger)

---

## 🔄 Data Flow Examples

### Student Onboarding Flow
1. Sign up → Email verification
2. Login → Check profiling status
3. If not profiled → Redirect to `/onboarding/ai-profiler`
4. Complete 7 profiling modules → FastAPI processes
5. Track recommendation → Django syncs status
6. Check foundations → If incomplete, redirect to `/dashboard/student/foundations`
7. Complete foundations → Full dashboard access

### Mission Execution Flow
1. Student selects mission → Mission details page
2. Execute mission → Submit artifacts
3. Mentor reviews → Work queue assignment
4. Feedback provided → Student receives notification
5. Community integration → Mission discussions

### Recipe Learning Flow
1. Student browses recipes → Filtered by track/skill
2. Select recipe → Recipe detail page
3. Follow steps → Progress tracking
4. Complete validation → Recipe marked complete
5. Recommendations → AI suggests next recipes

---

## 🎯 Key Metrics & Analytics

### Student Metrics
- Readiness score (0-100)
- Time to ready (days)
- Skill heatmap
- Top 3 skill gaps
- Habit streaks
- Mission completion rate
- Recipe completion rate

### Platform Metrics
- Active users by role
- Cohort enrollment rates
- Mentor-mentee matching success
- Subscription conversion
- Marketplace job matches
- Community engagement

---

## 🔧 Development Workflow

### Frontend Development
```bash
cd frontend/nextjs_app
npm install
npm run dev  # http://localhost:3000
```

### Backend Development
```bash
cd backend/django_app
python manage.py runserver  # http://localhost:8000

cd backend/fastapi_app
uvicorn main:app --reload  # http://localhost:8001
```

### Docker Development
```bash
docker-compose up -d
```

---

## 🎨 Design System

### Color Palette (OCH Theme)
- `och-midnight` - Primary dark background
- `och-mint` - Primary accent (#33FFC1)
- `och-defender` - Secondary accent
- `och-gold` - Mentor color
- `och-orange` - Analyst color
- `och-steel` - Text secondary
- `och-savanna-green` - Success states

### Typography
- Tailwind CSS default font stack
- Responsive typography scales

### Components
- shadcn/ui component library
- Custom role-specific components
- Framer Motion animations
- Responsive design (mobile-first)

---

## 📦 Key Dependencies Summary

### Frontend Critical Dependencies
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS, shadcn/ui, Framer Motion
- Zustand, TanStack Query, SWR
- Prisma, Supabase
- Axios, Recharts

### Backend Critical Dependencies
- Django 4.2+, FastAPI 0.104+
- PostgreSQL (relational + vector)
- Redis, JWT, Stripe
- Anthropic, OpenAI
- Prometheus

---

## 🚨 Known Architecture Notes

1. **Dual Backend:** Django (main API) + FastAPI (AI services)
2. **Dual Database:** PostgreSQL relational + PostgreSQL vector
3. **Onboarding Guards:** Profiling → Foundations → Dashboard
4. **Cache Layer:** Student dashboard uses denormalized cache
5. **SSE Support:** Real-time mentorship coordination
6. **Role-Based Routing:** Extensive role-specific dashboards
7. **Microservices Pattern:** Modular Django apps with clear separation

---

## 📊 Code Statistics

- **Frontend:** ~1,261 files (769 .tsx, 292 .ts)
- **Backend Django:** ~576 files (490 .py)
- **Backend FastAPI:** ~30+ files
- **Components:** 288 React components
- **API Routes:** 100+ endpoints
- **Database Models:** 50+ models

---

**End of Application Scan Summary**
