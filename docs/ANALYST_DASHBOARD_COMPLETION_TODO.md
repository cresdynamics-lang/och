# Analyst Dashboard Completion - Comprehensive TODO List

**Status**: 95% LIVE - Completing final 3 features  
**Route**: `/analyst/[userId]/dashboard` ✅  
**RBAC**: `role === 'analyst'` ✅  
**Tech Stack**: Next.js 15, Tailwind, shadcn/ui, Zustand, SSE Realtime

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

### Phase 0: System Analysis & Preparation
- [ ] **0.1** Review existing analyst dashboard structure (`app/analyst/[userId]/dashboard/page.tsx`)
- [ ] **0.2** Audit existing components (`components/analyst/*`)
- [ ] **0.3** Review existing API endpoints (`app/api/analyst/[userId]/*`)
- [ ] **0.4** Verify Zustand store structure (`stores/*` or `lib/stores/*`)
- [ ] **0.5** Test existing SSE realtime streams (`/api/analyst/[userId]/stream`)
- [ ] **0.6** Document current data flow patterns
- [ ] **0.7** Create feature branch: `feature/analyst-dashboard-completion`

---

## 🎯 TASK 1: CONTENT INTEGRATION ENGINE

### 1.1 Type Definitions & API Contracts

- [ ] **1.1.1** Create `types/analyst-content.ts`:
  ```typescript
  export interface AnalystContent {
    trackProgress: {
      currentLevel: number;
      percentComplete: number;
    };
    pending: {
      nextVideo: {
        id: string;
        title: string;
        duration: string;
        url: string;
      } | null;
      quizzes: Array<{
        id: string;
        title: string;
        due: string;
        classAvg: number;
      }>;
      recipes: Array<{
        level: number;
        title: string;
        status: 'locked' | 'available' | 'completed';
      }>;
    };
    defenderTrack: Array<{
      level: number; // 1-4
      recipes: Array<{
        title: string;
        videoUrl?: string;
        quizId?: string;
        status: 'locked' | 'available' | 'completed';
      }>;
    }>;
  }
  ```

- [ ] **1.1.2** Update `lib/analyst-api.ts`:
  - [ ] Add `content: (userId: string) => `/api/analyst/${userId}/content` endpoint
  - [ ] Add `progressAdvance: (userId: string) => `/api/analyst/${userId}/progress/advance` endpoint
  - [ ] Export `AnalystContent` type

### 1.2 Backend API Endpoints

- [ ] **1.2.1** Create `app/api/analyst/[userId]/content/route.ts`:
  - [ ] GET handler returning `AnalystContent` shape
  - [ ] Mock data with realistic SOC L1 content (SIEM Querying video, Alert Triage quiz, IOC Hunting recipe)
  - [ ] Include track progress calculation (currentLevel: 1, percentComplete: 0.68)
  - [ ] Return pending items sorted by urgency
  - [ ] Return defenderTrack with 4 levels × 5 recipes each

- [ ] **1.2.2** Create `app/api/analyst/[userId]/progress/advance/route.ts`:
  - [ ] POST handler for level advancement
  - [ ] Validate readiness (82%+ required)
  - [ ] Return confirmation with new level
  - [ ] Mock implementation with validation

- [ ] **1.2.3** Create `app/api/analyst/[userId]/quiz/[quizId]/start/route.ts`:
  - [ ] POST handler to start quiz
  - [ ] Return quiz session data
  - [ ] Mock implementation

### 1.3 Frontend Components

- [ ] **1.3.1** Create `components/analyst/LearningContentPanel.tsx`:
  - [ ] Replace static `LearningPanel` content
  - [ ] Accept `content: AnalystContent` prop
  - [ ] Implement video carousel with thumbnail
  - [ ] Show "SIEM Querying (7min)" with play button
  - [ ] Display quiz urgency badges (red if due soon)
  - [ ] Show "Alert Triage due 23:59 (class avg 84%)"
  - [ ] Implement track roadmap accordion (4 levels × 5 recipes)
  - [ ] Show locked/available/completed status per recipe
  - [ ] Add progress ring showing "68% complete (12/18 videos, 9/12 quizzes)"
  - [ ] Use shadcn/ui components (Card, Button, Badge, Progress, Accordion)
  - [ ] Follow cyber blue theme (#3b82f6)

- [ ] **1.3.2** Create `components/analyst/VideoPlayerModal.tsx` (enhance existing):
  - [ ] Modal component using shadcn/ui Dialog
  - [ ] iframe/embed for video playback
  - [ ] Support video URL from content API
  - [ ] Track completion status
  - [ ] Close button and keyboard navigation

- [ ] **1.3.3** Create `components/analyst/QuizUrgencyBadge.tsx`:
  - [ ] Red badge for due soon (< 24h)
  - [ ] Yellow badge for due today
  - [ ] Green badge for upcoming
  - [ ] Show class average percentage
  - [ ] Click handler to start quiz

- [ ] **1.3.4** Create `components/analyst/TrackRoadmap.tsx`:
  - [ ] Collapsible accordion (shadcn/ui Accordion)
  - [ ] 4 levels displayed
  - [ ] 5 recipes per level
  - [ ] Locked recipes grayed out with lock icon
  - [ ] Available recipes clickable
  - [ ] Completed recipes with checkmark
  - [ ] Progress indicator per level

- [ ] **1.3.5** Create `components/analyst/ProgressRing.tsx`:
  - [ ] Circular progress indicator
  - [ ] Shows percentage (68%)
  - [ ] Displays "12/18 videos, 9/12 quizzes" text
  - [ ] Uses SVG or shadcn/ui Progress component
  - [ ] Cyber blue color scheme

- [ ] **1.3.6** Create `components/analyst/LevelAdvanceModal.tsx`:
  - [ ] Confirmation dialog for level advancement
  - [ ] Shows readiness requirement (82%+)
  - [ ] POST to `/api/analyst/[userId]/progress/advance`
  - [ ] Success/error handling
  - [ ] Refresh content after advancement

### 1.4 Integration & Updates

- [ ] **1.4.1** Update `components/analyst/LearningPanel.tsx`:
  - [ ] Replace static content with `<LearningContentPanel />`
  - [ ] Fetch content from `/api/analyst/[userId]/content`
  - [ ] Use React Query/SWR for data fetching
  - [ ] Add Suspense skeleton loading state
  - [ ] Handle error states

- [ ] **1.4.2** Update `components/analyst/SidePanelTabs.tsx`:
  - [ ] Ensure LearningPanel uses new content engine
  - [ ] Verify tab switching works correctly

- [ ] **1.4.3** Create quiz route `app/analyst/[userId]/quiz/[quizId]/page.tsx`:
  - [ ] Quiz interface component
  - [ ] Fetch quiz data from API
  - [ ] Submit answers
  - [ ] Show results and class comparison

- [ ] **1.4.4** Add content-gating logic:
  - [ ] Check recipe status before allowing access
  - [ ] Show "Unlock Next Level" button when ready
  - [ ] Validate prerequisites before unlocking

---

## 🎯 TASK 2: ADVANCED TRIAGE TOOLS (Wireshark/YARA/Sigma)

### 2.1 Type Definitions & API Contracts

- [ ] **2.1.1** Create `types/analyst-tools.ts`:
  ```typescript
  export type ToolType = 'wireshark' | 'yara' | 'sigma';
  
  export interface ToolAnalysisRequest {
    tool: ToolType;
    payload: {
      // Wireshark
      pcapFile?: string;
      filter?: string;
      // YARA
      rule?: string;
      testData?: string;
      // Sigma
      ioc?: string;
      searchQuery?: string;
    };
  }
  
  export interface ToolAnalysisResponse {
    results: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      ioc?: string;
    }>;
    mttrUpdate: string; // "18min"
    metadata?: Record<string, any>;
  }
  ```

- [ ] **2.1.2** Update `lib/analyst-api.ts`:
  - [ ] Add `toolsAnalyze: (userId: string) => `/api/analyst/${userId}/tools/analyze` endpoint
  - [ ] Export tool types and interfaces

### 2.2 Backend API Endpoints

- [ ] **2.2.1** Create `app/api/analyst/[userId]/tools/analyze/route.ts`:
  - [ ] POST handler accepting `ToolAnalysisRequest`
  - [ ] Route to appropriate tool handler based on `tool` type
  - [ ] Return `ToolAnalysisResponse` with mock results
  - [ ] Mock Wireshark: "Ryuk beacon detected on 192.168.4.17"
  - [ ] Mock YARA: Match results with rule testing
  - [ ] Mock Sigma: "47 Sigma hits: ryuk.exe"
  - [ ] Update MTTR calculation

### 2.3 Frontend Components

- [ ] **2.3.1** Create `components/analyst/AdvancedToolsPanel.tsx`:
  - [ ] Replace/enhance existing `ToolsPanel`
  - [ ] 300px card layout (matches side panel width)
  - [ ] Three tool launcher buttons:
    - [ ] Wireshark Lab button
    - [ ] YARA Editor button
    - [ ] Sigma IOC Hunter button
  - [ ] Use shadcn/ui Button components
  - [ ] Icons from Lucide React
  - [ ] Hover effects with cyber blue accent

- [ ] **2.3.2** Create `components/analyst/WiresharkLabModal.tsx`:
  - [ ] Modal dialog (shadcn/ui Dialog)
  - [ ] Button: "Analyze MTN Pcap (47 packets)"
  - [ ] Packet list display (table/grid)
  - [ ] Filter/search input
  - [ ] IOC highlight functionality
  - [ ] Results section: "Ryuk beacon detected on 192.168.4.17"
  - [ ] Mock packet data with realistic SOC scenarios
  - [ ] Export functionality

- [ ] **2.3.3** Enhance `components/analyst/WiresharkLab.tsx` (if exists):
  - [ ] Integrate with new API endpoint
  - [ ] Add packet analysis features
  - [ ] Implement IOC detection highlighting

- [ ] **2.3.4** Create `components/analyst/YARAEditorModal.tsx`:
  - [ ] Modal dialog
  - [ ] Button: "Test ryuk_network_beacon rule"
  - [ ] Ace editor integration (or CodeMirror)
  - [ ] Syntax highlighting for YARA rules
  - [ ] Test button
  - [ ] Match results display
  - [ ] Sample YARA rule pre-loaded
  - [ ] Error handling for invalid syntax

- [ ] **2.3.5** Enhance `components/analyst/YARARuleEditor.tsx` (if exists):
  - [ ] Integrate with new API endpoint
  - [ ] Add rule testing functionality
  - [ ] Show match results

- [ ] **2.3.6** Create `components/analyst/SigmaIOCHunter.tsx`:
  - [ ] Input field for IOC (e.g., "192.168.4.17")
  - [ ] Search button
  - [ ] Results display: "47 Sigma hits: ryuk.exe"
  - [ ] List of matching Sigma rules
  - [ ] Severity indicators
  - [ ] Export results option

- [ ] **2.3.7** Create `components/analyst/ToolResultsDisplay.tsx`:
  - [ ] Reusable component for displaying tool results
  - [ ] Supports all three tool types
  - [ ] Severity badges
  - [ ] IOC highlighting
  - [ ] Copy to clipboard functionality

### 2.4 Command Palette Integration

- [ ] **2.4.1** Review existing ⌘K implementation:
  - [ ] Check if command palette exists (`components/ui/Command` or similar)
  - [ ] Verify keyboard shortcut handling

- [ ] **2.4.2** Add tool commands to palette:
  - [ ] "wireshark" → Open Wireshark Lab Modal
  - [ ] "yara" → Open YARA Editor Modal
  - [ ] "sigma" → Open Sigma IOC Hunter
  - [ ] Register commands with proper handlers

- [ ] **2.4.3** Create `hooks/useCommandPalette.ts`:
  - [ ] Hook for managing command palette state
  - [ ] Register tool commands
  - [ ] Handle command execution
  - [ ] Integrate with existing palette if available

### 2.5 Integration & Updates

- [ ] **2.5.1** Update `components/analyst/ToolsPanel.tsx`:
  - [ ] Replace/enhance with `<AdvancedToolsPanel />`
  - [ ] Maintain existing functionality
  - [ ] Add new tool launchers
  - [ ] Ensure 300px width constraint

- [ ] **2.5.2** Update `components/analyst/PriorityTasksCompact.tsx`:
  - [ ] Add tool launcher buttons to triage actions
  - [ ] Quick access to Wireshark/YARA/Sigma from alerts
  - [ ] Context-aware tool suggestions

- [ ] **2.5.3** Add tool usage tracking:
  - [ ] Log tool usage to analytics
  - [ ] Track MTTR improvements
  - [ ] Store recent tool usage

---

## 🎯 TASK 3: FULL CAREER PIPELINE (Signals + Auto-Resume)

### 3.1 Type Definitions & API Contracts

- [ ] **3.1.1** Create `types/analyst-career.ts`:
  ```typescript
  export interface CareerMatch {
    id: string;
    company: string;
    position: string;
    matchScore: number; // 0-100
    status: 'applied' | 'shortlisted' | 'interview' | 'offer' | 'rejected';
    logoUrl?: string;
    appliedAt?: string;
    interviewDate?: string;
  }
  
  export interface CareerPipeline {
    matches: CareerMatch[];
    portfolio: {
      viewsThisWeek: number;
      employerViews: number;
      totalViews: number;
    };
    pipeline: {
      portfolioViews: number;
      shortlists: number;
      interviews: number;
      offers: number;
    };
    resumeUrl: string | null; // Auto-generated PDF URL
    resumeExpiry: string | null; // ISO date
    readinessBadge: 'ready' | 'almost' | 'building'; // Based on 82%+ readiness
  }
  ```

- [ ] **3.1.2** Update `lib/analyst-api.ts`:
  - [ ] Add `career: (userId: string) => `/api/analyst/${userId}/career` endpoint
  - [ ] Add `resumeGenerate: (userId: string) => `/api/analyst/${userId}/resume/generate` endpoint
  - [ ] Export career types

### 3.2 Backend API Endpoints

- [ ] **3.2.1** Enhance `app/api/analyst/[userId]/career/route.ts` (if exists):
  - [ ] GET handler returning `CareerPipeline` shape
  - [ ] Mock data with realistic matches:
    - [ ] MTN SOC L1: 92% [Applied ✓]
    - [ ] Ecobank GRC: 78% [Available]
    - [ ] Vodacom: Interview tomorrow [Prep]
  - [ ] Calculate pipeline funnel (views → shortlists → interviews → offers)
  - [ ] Include portfolio view counts
  - [ ] Return resume URL if generated (with expiry)

- [ ] **3.2.2** Create `app/api/analyst/[userId]/resume/generate/route.ts`:
  - [ ] POST handler to generate resume PDF
  - [ ] Mock PDF generation (return URL)
  - [ ] Set 7-day expiry
  - [ ] Return resume URL and expiry date
  - [ ] Track generation in analytics

- [ ] **3.2.3** Create `app/api/analyst/[userId]/career/apply/route.ts`:
  - [ ] POST handler for 1-click apply
  - [ ] Accept match ID
  - [ ] Update match status to 'applied'
  - [ ] Return confirmation

### 3.3 Frontend Components

- [ ] **3.3.1** Create `components/analyst/CareerPipelinePanel.tsx`:
  - [ ] Replace/enhance existing `CareerPanel`
  - [ ] Accept `career: CareerPipeline` prop
  - [ ] Horizontal funnel visualization:
    - [ ] Portfolio Views (47/wk)
    - [ ] Shortlists (8)
    - [ ] Interviews (3)
    - [ ] Offers (1)
  - [ ] Use Recharts or custom SVG
  - [ ] Company logos display
  - [ ] Count badges on each stage
  - [ ] Cyber blue theme with gradients

- [ ] **3.3.2** Create `components/analyst/CareerMatchesList.tsx`:
  - [ ] Display top matches
  - [ ] Match card component:
    - [ ] Company logo
    - [ ] Position title
    - [ ] Match score (92%)
    - [ ] Status badge (Applied ✓, Available, Interview)
    - [ ] 1-click Apply button (if available)
    - [ ] Interview prep link (if interview scheduled)
  - [ ] Sort by match score
  - [ ] Filter by status
  - [ ] Swipe gestures for mobile (swipe right → apply)

- [ ] **3.3.3** Create `components/analyst/AutoResumeGenerator.tsx`:
  - [ ] Button: "Generate Resume PDF"
  - [ ] POST to `/api/analyst/[userId]/resume/generate`
  - [ ] Loading state during generation
  - [ ] Download button when ready
  - [ ] Show expiry date (7-day expiry)
  - [ ] Badge: "Ready for MTN HR" if 82%+ readiness
  - [ ] Regenerate button when expired

- [ ] **3.3.4** Create `components/analyst/CareerFunnel.tsx`:
  - [ ] Horizontal funnel component
  - [ ] 4 stages: Views → Shortlists → Interviews → Offers
  - [ ] Animated progress bars
  - [ ] Count badges
  - [ ] Company logos in each stage
  - [ ] Tooltip on hover showing details

- [ ] **3.3.5** Create `components/analyst/MatchCard.tsx`:
  - [ ] Reusable card for career matches
  - [ ] Company logo (with fallback)
  - [ ] Match score visualization (circular or bar)
  - [ ] Status badge
  - [ ] Action buttons (Apply, Prep, View)
  - [ ] Hover effects
  - [ ] Mobile swipe support

- [ ] **3.3.6** Create `components/analyst/ResumeDownloadButton.tsx`:
  - [ ] Download button component
  - [ ] Shows expiry countdown
  - [ ] Handles PDF download
  - [ ] Error handling for expired resumes
  - [ ] Regenerate option

### 3.4 Integration & Updates

- [ ] **3.4.1** Update `components/analyst/CareerPanel.tsx`:
  - [ ] Replace static content with `<CareerPipelinePanel />`
  - [ ] Fetch career data from `/api/analyst/[userId]/career`
  - [ ] Use React Query/SWR
  - [ ] Add Suspense skeleton
  - [ ] Handle error states

- [ ] **3.4.2** Update `components/analyst/MetricsPanel.tsx`:
  - [ ] Add realtime employer signals
  - [ ] Show portfolio views count
  - [ ] Display new matches badge
  - [ ] Integrate with SSE updates

- [ ] **3.4.3** Create apply confirmation flow:
  - [ ] Modal confirmation for 1-click apply
  - [ ] Success message
  - [ ] Update match status in UI
  - [ ] Refresh career data

- [ ] **3.4.4** Add mobile swipe gestures:
  - [ ] Swipe right on match card → Apply
  - [ ] Swipe left → Dismiss/Archive
  - [ ] Use touch event handlers
  - [ ] Visual feedback during swipe

---

## 📱 MOBILE ENHANCEMENTS

### 4.1 Bottom Navigation Updates

- [ ] **4.1.1** Update `components/analyst/MobileBottomNav.tsx`:
  - [ ] Add tool icons to tabs
  - [ ] Update tab labels:
    - [ ] 🚨 Lab (existing)
    - [ ] 📚 Learn (existing)
    - [ ] 🎯 Career (existing)
    - [ ] ⚙️ Tools (add icon)
    - [ ] 📊 Metrics (existing)
  - [ ] Ensure all 5 tabs are visible
  - [ ] Test tab switching

### 4.2 Swipe Gestures

- [ ] **4.2.1** Create `hooks/useSwipeGesture.ts`:
  - [ ] Generic swipe detection hook
  - [ ] Support left/right swipes
  - [ ] Threshold configuration
  - [ ] Callback on swipe complete

- [ ] **4.2.2** Add swipe to `components/analyst/PriorityTasksCompact.tsx`:
  - [ ] Swipe left on alert → Quick triage action
  - [ ] Visual feedback during swipe
  - [ ] Action menu on swipe

- [ ] **4.2.3** Add swipe to `components/analyst/MatchCard.tsx`:
  - [ ] Swipe right → 1-click apply
  - [ ] Swipe left → Dismiss
  - [ ] Animated card movement
  - [ ] Undo option

### 4.3 Mobile Tool Access

- [ ] **4.3.1** Update mobile overlay for tools:
  - [ ] Add Wireshark/YARA/Sigma buttons to mobile Tools overlay
  - [ ] Ensure modals work on mobile
  - [ ] Test touch interactions

---

## ⚙️ REALTIME SSE UPDATES (Enhance Existing)

### 5.1 SSE Stream Enhancements

- [ ] **5.1.1** Review `app/api/analyst/[userId]/stream/route.ts`:
  - [ ] Verify existing SSE implementation
  - [ ] Check event types currently supported

- [ ] **5.1.2** Add new event types to SSE stream:
  - [ ] `analyst-alerts`: `{ alerts: 7, mttr: "18min", accuracy: "91%" }`
  - [ ] `analyst-career`: `{ views: 47, newMatches: 1 }`
  - [ ] `analyst-content`: `{ newQuizDue: true }`
  - [ ] Update stream handler to include these events

### 5.2 Zustand Store Updates

- [ ] **5.2.1** Review/create `stores/analystStore.ts`:
  - [ ] Check if `useOchStore` exists and structure
  - [ ] Create analyst-specific store if needed

- [ ] **5.2.2** Add realtime state to store:
  ```typescript
  interface AnalystRealtimeState {
    alerts: {
      count: number;
      mttr: string;
      accuracy: number;
    };
    career: {
      views: number;
      newMatches: number;
    };
    content: {
      newQuizDue: boolean;
    };
  }
  ```

- [ ] **5.2.3** Create `hooks/useAnalystRealtime.ts`:
  - [ ] Connect to SSE stream `/api/analyst/[userId]/stream`
  - [ ] Parse incoming events
  - [ ] Update Zustand store with `useOchStore.setState({ realtime: { ...data } })`
  - [ ] Handle reconnection logic
  - [ ] 3-second refresh interval

- [ ] **5.2.4** Integrate realtime updates in components:
  - [ ] `PriorityTasksCompact` → Use realtime alerts
  - [ ] `CareerPanel` → Use realtime career signals
  - [ ] `LearningContentPanel` → Use realtime content updates
  - [ ] `ProgressShelfMicro` → Use realtime metrics

---

## 🎨 STYLING & THEME CONSISTENCY

### 6.1 Cyber Blue Theme

- [ ] **6.1.1** Verify theme variables in `app/globals.css`:
  - [ ] Primary: `#3b82f6` (cyber blue)
  - [ ] Accent: `#10b981` (go), `#ef4444` (alert)
  - [ ] Dark: `#0f172a` → `#1e293b` gradient

- [ ] **6.1.2** Ensure all new components use theme:
  - [ ] Use Tailwind classes: `bg-och-defender-blue`, `text-och-cyber-mint`
  - [ ] Consistent hover effects: `hover:shadow-cyan-500/20 scale-102`
  - [ ] Backdrop blur on cards: `backdrop-blur`

- [ ] **6.1.3** Update component styles:
  - [ ] All new modals use cyber blue accents
  - [ ] Buttons follow theme
  - [ ] Badges use correct colors
  - [ ] Progress indicators match theme

### 6.2 Responsive Design

- [ ] **6.2.1** Test all new components on mobile:
  - [ ] Breakpoints: sm, md, lg, xl
  - [ ] Touch interactions work
  - [ ] Modals are mobile-friendly
  - [ ] Tables/grids scroll properly

- [ ] **6.2.2** Ensure desktop layout integrity:
  - [ ] 300px side panel width maintained
  - [ ] Grid layouts don't break
  - [ ] Overlays work correctly

---

## 🔐 API STUBS & MOCK DATA

### 7.1 Create Missing API Endpoints

- [ ] **7.1.1** `POST /api/analyst/[userId]/tools/analyze`:
  - [ ] Mock Wireshark analysis
  - [ ] Mock YARA rule testing
  - [ ] Mock Sigma IOC search
  - [ ] Return realistic SOC L1 data (ryuk.exe, 192.168.4.17, etc.)

- [ ] **7.1.2** `POST /api/analyst/[userId]/quiz/[quizId]/start`:
  - [ ] Create quiz session
  - [ ] Return quiz questions
  - [ ] Mock implementation

- [ ] **7.1.3** `POST /api/analyst/[userId]/resume/generate`:
  - [ ] Generate resume PDF (mock)
  - [ ] Return download URL
  - [ ] Set 7-day expiry
  - [ ] Track generation

- [ ] **7.1.4** `GET /api/analyst/[userId]/career` (enhance if exists):
  - [ ] Return full pipeline data
  - [ ] Include matches, portfolio views, resume URL
  - [ ] Mock realistic data

- [ ] **7.1.5** `POST /api/analyst/[userId]/career/apply`:
  - [ ] Handle 1-click apply
  - [ ] Update match status
  - [ ] Return confirmation

### 7.2 Mock Data Quality

- [ ] **7.2.1** Ensure mock data is realistic:
  - [ ] SOC L1 scenarios (ryuk.exe, ransomware IOCs)
  - [ ] Realistic IP addresses (192.168.4.17)
  - [ ] Proper timestamps
  - [ ] Consistent naming conventions

- [ ] **7.2.2** Add data validation:
  - [ ] Type checking in API routes
  - [ ] Error handling for invalid requests
  - [ ] Proper HTTP status codes

---

## ✅ PRODUCTION CHECKLIST

### 8.1 Functionality

- [ ] **8.1.1** RBAC: Verify `role === 'analyst'` check works
- [ ] **8.1.2** Route: `/analyst/[userId]/dashboard` accessible
- [ ] **8.1.3** All 6 side panels render correctly
- [ ] **8.1.4** Mobile bottom tabs work
- [ ] **8.1.5** SSE realtime updates (3s refresh)
- [ ] **8.1.6** ⌘K command palette functional
- [ ] **8.1.7** Content gating (recipes lock levels)
- [ ] **8.1.8** Print CSS (Daily Digest + Resume)

### 8.2 Performance

- [ ] **8.2.1** Lighthouse score 95+:
  - [ ] Performance
  - [ ] Accessibility
  - [ ] Best Practices
  - [ ] SEO

- [ ] **8.2.2** Suspense skeletons for all loading states
- [ ] **8.2.3** Code splitting for modals
- [ ] **8.2.4** Image optimization
- [ ] **8.2.5** Bundle size check

### 8.3 Accessibility

- [ ] **8.3.1** ARIA labels on all interactive elements
- [ ] **8.3.2** Keyboard navigation works
- [ ] **8.3.3** Screen reader testing
- [ ] **8.3.4** Focus management in modals
- [ ] **8.3.5** Color contrast compliance

### 8.4 Testing

- [ ] **8.4.1** Test content integration:
  - [ ] Video playback works
  - [ ] Quiz start flow works
  - [ ] Recipe unlocking works
  - [ ] Level advancement works

- [ ] **8.4.2** Test advanced tools:
  - [ ] Wireshark analysis works
  - [ ] YARA editor works
  - [ ] Sigma search works
  - [ ] ⌘K shortcuts work

- [ ] **8.4.3** Test career pipeline:
  - [ ] Pipeline visualization renders
  - [ ] 1-click apply works
  - [ ] Resume generation works
  - [ ] Swipe gestures work

- [ ] **8.4.4** Test mobile:
  - [ ] Bottom tabs work
  - [ ] Swipe gestures work
  - [ ] Modals are mobile-friendly
  - [ ] Touch interactions work

- [ ] **8.4.5** Test realtime:
  - [ ] SSE connection establishes
  - [ ] Updates appear in UI
  - [ ] Reconnection works
  - [ ] Store updates correctly

### 8.5 Documentation

- [ ] **8.5.1** Update component documentation
- [ ] **8.5.2** Document API endpoints
- [ ] **8.5.3** Add JSDoc comments to new functions
- [ ] **8.5.4** Update README if needed

---

## 🚀 DEPLOYMENT CHECKLIST

### 9.1 Pre-Deployment

- [ ] **9.1.1** Run TypeScript type checking: `npm run type-check`
- [ ] **9.1.2** Run linter: `npm run lint`
- [ ] **9.1.3** Run build: `npm run build`
- [ ] **9.1.4** Fix all build errors
- [ ] **9.1.5** Test locally: `npm run dev`

### 9.2 Code Review

- [ ] **9.2.1** Review all new components
- [ ] **9.2.2** Verify no breaking changes
- [ ] **9.2.3** Check for console errors
- [ ] **9.2.4** Verify API endpoints work
- [ ] **9.2.5** Test with real user data (if available)

### 9.3 Deployment

- [ ] **9.3.1** Merge to main branch
- [ ] **9.3.2** Deploy to staging (if applicable)
- [ ] **9.3.3** Smoke test on staging
- [ ] **9.3.4** Deploy to production
- [ ] **9.3.5** Monitor for errors

---

## 📝 NOTES & CONSIDERATIONS

### Important Reminders

1. **Don't Break Existing Functionality**:
   - Test existing panels still work
   - Verify SSE streams still function
   - Ensure mobile navigation works
   - Check RBAC still enforces correctly

2. **Follow Existing Patterns**:
   - Use same data fetching patterns (React Query/SWR)
   - Follow component structure conventions
   - Use existing shadcn/ui components
   - Match styling patterns

3. **Performance**:
   - Lazy load modals
   - Use Suspense for async components
   - Optimize images
   - Minimize re-renders

4. **Accessibility**:
   - All interactive elements keyboard accessible
   - Proper ARIA labels
   - Focus management
   - Screen reader friendly

5. **Mobile First**:
   - Test on mobile devices
   - Ensure touch interactions work
   - Verify responsive layouts
   - Test swipe gestures

---

## 🎯 PRIORITY ORDER

### Phase 1: Foundation (Week 1)
1. Task 1.1: Type Definitions & API Contracts
2. Task 1.2: Backend API Endpoints
3. Task 2.1: Tool Type Definitions
4. Task 2.2: Tool API Endpoints
5. Task 3.1: Career Type Definitions
6. Task 3.2: Career API Endpoints

### Phase 2: Core Features (Week 2)
1. Task 1.3: Content Integration Components
2. Task 1.4: Content Integration Updates
3. Task 2.3: Advanced Tools Components
4. Task 3.3: Career Pipeline Components

### Phase 3: Integration & Polish (Week 3)
1. Task 2.4: Command Palette Integration
2. Task 2.5: Tools Integration
3. Task 3.4: Career Integration
4. Task 4: Mobile Enhancements
5. Task 5: SSE Updates
6. Task 6: Styling & Theme

### Phase 4: Testing & Deployment (Week 4)
1. Task 7: API Stubs & Mock Data
2. Task 8: Production Checklist
3. Task 9: Deployment

---

**Total Tasks**: ~150+ individual checklist items  
**Estimated Time**: 4 weeks  
**Status**: Ready to begin implementation

