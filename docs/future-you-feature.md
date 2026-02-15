# Future You — Feature Documentation

## What Is It?

**Future You** is an AI-powered career intelligence page in the student dashboard. It answers one question:

> *"Based on everything I have done so far — where am I headed, and what does my future cybersecurity career look like?"*

No manual input required. The page watches real student activity — missions, lessons, scores, hours, track — and automatically generates a living career prediction that updates as the student progresses. No profiling assessment is needed.

---

## How It Works

### Data Collection
On every page load, a real-time snapshot is collected from three sources:

| Source | Data Collected |
|---|---|
| **Student Analytics** | Missions completed, average score, hours invested, circle level, lessons, modules |
| **Track Progress** | Completion %, readiness score, skills mastered, weak areas |
| **Profiler Session** *(optional)* | Behavioral strengths, growth areas, aptitude scores |

### AI Prediction
The data is sent to **GPT (gpt-4o-mini)** which:
1. Determines the student's current stage: Beginner → Junior → Mid-level → Senior
2. Generates a **Future You Persona** — title, archetype, career vision
3. Predicts the 3 most likely **job roles** they're heading towards
4. Lists 5 **skills** they will master in their track
5. Identifies specific **skill gaps** with priorities
6. Calculates a **career readiness %** from real metrics
7. Recommends **5 next steps** tailored to their stage

### 3-Tier Fallback System
The page never fails. When GPT is unavailable, it falls back gracefully:

| Tier | Condition | Badge shown |
|---|---|---|
| **1 — GPT** | Fresh call succeeds | "AI Predicted" (grey) |
| **2 — DB Cache** | GPT fails, previous GPT response exists in DB | "Saved AI Prediction" (blue) |
| **3 — Track Fallback** | GPT fails, no DB row yet (first time) | "Track-Based Prediction" (amber) |

**Tier 1** results are saved to the `future_you_insights_cache` table in PostgreSQL so Tier 2 is always ready for future outages. The DB is only written on GPT success — never with fallback data.

**Memory cache:** GPT results cached 1 hour; DB/fallback results cached 30 minutes.

### Persona Resolution Priority
1. Profiler session persona (if student completed assessment)
2. AI-predicted persona from activity data
3. Merged — profiler fields take precedence, AI adds `predicted_roles`, `estimated_career_level`

---

## Readiness Score Formula

```
readiness = (missions × 3) + (avg_score × 0.2) + (progress × 0.3) + min(hours × 2, 20)
Max: 95%
```

Career level uses the same inputs:

| Score | Level |
|---|---|
| < 15 or Circle Level < 2 | Beginner |
| 15–44 or Level < 3 | Junior |
| 45–99 or Level < 5 | Mid-level |
| 100+ and Level ≥ 5 | Senior |

---

## Track Personas

Each track has 4 career-stage personas used by both the AI prompt and the fallback engine:

| Track | Beginner | Junior | Mid-level | Senior |
|---|---|---|---|---|
| 🛡️ **Defender** | The Digital Guardian | The Network Protector | The Threat Responder | The Security Sentinel |
| ⚔️ **Offensive** | The Cyber Infiltrator | The Exploit Developer | The Red Team Operator | The Adversary Emulator |
| 📋 **GRC** | The Compliance Seeker | The Risk Identifier | The Governance Analyst | The Risk Strategist |
| 🔬 **Innovation** | The Security Explorer | The Cloud Defender | The Security Architect | The Zero Trust Pioneer |
| 👑 **Leadership** | The Security Apprentice | The Team Coordinator | The Security Manager | The CISO-in-Training |

---

## UI Sections

### 1. Persona Hero Card
The large coloured card matching the student's track theme.

| Element | Meaning |
|---|---|
| Track badge | Enrolled cybersecurity track |
| Career Level badge | Beginner / Junior / Mid-level / Senior (computed from data) |
| Track Match % | Only shown if profiling completed — aptitude alignment |
| Source label | Which tier generated this prediction (grey / blue / amber) |
| Persona Name | AI-generated creative title for the student's future self |
| Archetype | Short professional role label |
| Career Vision | 2–3 sentences about who this student will become |
| Predicted Career Roles | Up to 3 specific job titles they're heading towards |
| Skills You Will Master | Up to 6 technical skills projected for their track |

### 2. Career Readiness Ring
Circular gauge (0–100%) computed from the readiness formula. Green = 70%+, Amber = 40–69%, Indigo = below 40%. Includes an AI-written explanation and a secondary Track Progress bar.

**Readiness ≠ Progress.** Track Progress measures modules/lessons done. Readiness weighs quality (scores) and consistency (missions, hours) together.

### 3. Journey Progress
Six live stats from the student's real activity: Circle Level, Missions Done, Modules Done, Lessons Done, Avg Score, Time Invested.

### 4. Skills Profile (Radar Chart)
- **Blue shape** — current proficiency per skill (0–100)
- **Green dashed shape** — projected proficiency after completing the track
- **Focus Areas** (red pills below) — specific weak areas from scoring data

New students see Current = 0 and Projected = AI-forecast targets, giving a forward-looking skills map from day one.

### 5. AI Career Insights
- **Career Path** — personalised narrative using the student's actual numbers
- **Gap Analysis** — named specific gaps (never generic), each with priority and action
- **Recommended Next Steps** — 5 stage-appropriate actions

### 6. Strengths & Growth Areas
Strengths show the AI's `career_outcome` arrow (e.g. "Analytical Thinking → effective threat hunting"). Growth areas come from profiler results or tracked weak areas. Both show empty states if no data yet.

---

## How Predictions Evolve

| Activity | Effect |
|---|---|
| More missions | Readiness rises; gaps become more specific |
| Higher scores | Career level may advance; narrative acknowledges quality |
| More modules/lessons | Track Progress fills; skills radar gains real data |
| More hours | Time Invested grows; readiness formula improves |
| Circle Level advances | Career level badge may advance |
| Profiler completed *(optional)* | Persona enriched with behavioral strengths |

Cache refreshes every hour. Students actively learning will see measurable changes on their next visit.

---

## Database Table

```sql
future_you_insights_cache
  user_id      BIGINT UNIQUE → users(id)  -- one row per student
  insights     JSONB                       -- full GPT response
  ai_source    VARCHAR(20)                 -- 'gpt' only (never fallback)
  track_key    VARCHAR(50)
  generated_at TIMESTAMPTZ
  updated_at   TIMESTAMPTZ
```

Only written on GPT success. Provides Tier 2 availability during outages without stale fallback data ever entering the DB.

---

## What This Feature Is Not

- Not a report card — it shows a trajectory, not an evaluation
- Not a fixed path — it evolves with every action the student takes
- Not guesswork — every value is computed from real data or expert track content
- Profiler assessment not required — adds depth but the full page works without it
- Not real-time — cache is up to 1 hour; activity in the last hour may not reflect yet
