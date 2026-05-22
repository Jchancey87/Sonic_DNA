# Hand-off Document: Sonic DNA — Bug Fixes & Feature Hardening

## Project Status: **Core Workflow Fully Functional** ✅
**Current State**: All five core workflow issues have been resolved. The app can now complete a full audit cycle end-to-end: import → load → audit → log techniques → review. Infrastructure remains connected to the remote Proxmox MongoDB instance.

---

## 🏗️ Technical Architecture
The system uses **Hexagonal Architecture (Ports & Adapters)** to isolate business logic from external dependencies.

- **Frontend (React)**: Uses `useBackend()` hook to interact with an abstract `IBackendService`. `HttpBackendAdapter` handles all live API calls.
- **Backend (Node/Express)**:
  - **Adapters**: `OpenAIAdapter` (supports OpenRouter), `TavilyAdapter` (Bearer auth, 6-source cap), `MongooseRepository`.
  - **Services**: `SongService`, `AuditService`, `TechniqueService`, `TemplateComposer` — all fully decoupled and unit-tested.
- **Database**: Proxmox MongoDB (`192.168.0.205:27017`).

---

## 💎 Key Features Delivered (This Session)

### 1. **Interactive Technique Notebook Overhaul**
- **3-Tab Control Center**: Overhauled the page into a central dashboard with three tabs: **🗂️ Library** (grid with search/sorting/lenses), **🏋️ Practice Room** (Kanban board with 6 columns grouped by `nextAction`), and **✍️ Quick Log** (manual standalone technique logger).
- **Interactive Console Cards**: Styled with musical lens color-coded borders. Built clickable 1-5 confidence stars, inline nextAction lane mapping, and auto-saving practice logs (updating the database on blur event). Exposes live sync status badges (`● SAVING...` and `✔ SAVED`).
- **Load & Seek Integration**: Clicking `LOAD & SEEK` loads the reference song in the persistent audio player (fetching metadata from backend if inactive) and seeks directly to the technique timestamp.

### 2. **User Preferences & Settings Panel**
- **Settings Page**: Added `/settings` page where users configure default timezone, default workflow type (Quick vs Guided), and default lenses.
- **Audit Auto-Population**: When initiating a new audit, settings are retrieved and pre-populate configuration fields dynamically.

### 3. **Audit Review Navigation**
- Dashboard now shows per-song **AUDIT HISTORY** toggle. Each audit is listed with lens badges, status, date, and a **Review →** link to the full `AuditDetail` page.
- Route: `GET /audit/:id` → `AuditDetail.jsx`

### 4. **YouTube Embedding Fixed**
- Changed `controls: 0 → 1` in YouTube player config. Added `origin` param for trusted embedding.
- Added `onError` handler: when a video blocks embedding (error codes 101/150), a fallback renders with a direct "Open in YouTube →" link.
- Custom tape deck scrubber and Play/Pause controls still work via the YouTube iframe API alongside native controls.

### 5. **Technique Notebook — Data Pipeline Fixed (Critical)**
- **Root cause**: `addTechnique()` in `AuditForm` only updated local React state. Techniques were embedded on `audit.techniques[]` (a subdoc array), but `TechniqueNotebook` queries the separate `TechniqueEntry` collection. These paths never connected.
- **Fix**: Each "Save to Notebook" click now immediately calls `POST /api/techniques` → `TechniqueService.addTechnique()` → `TechniqueEntry` collection. Techniques appear in the Notebook instantly without waiting for audit save/completion.

### 6. **Research Intelligence Overhaul**
- **Tavily**: Now runs a single focused search with `max_results: 6`. Stores structured source objects `{ title, url, content, score }` in `researchSummary.results[]`.
- **AI Template**: The `audits.js` creation route now reads `researchSummary.results[]` from MongoDB and passes up to 1500 chars of real source content to the AI template composer.
- **UI**: Collapsible **📡 RESEARCH INTELLIGENCE** panel in `AuditForm` shows all sources with titles, previews, and "Open ↗" links.

### 7. **Audio Playback Restored**
- Removed `pointerEvents: none` from the YouTube monitor container. The video player is now fully interactive, satisfying browser autoplay gesture policies.
- Monitor enlarged to `240×160px`, repositioned above the tape deck (`bottom: 155px`).
- Guided "Listen" step now shows an animated "▶ Press Play" instruction.

---

## 🚀 Environment & Running
- **Frontend**: `http://localhost:3050`
- **Backend**: `http://localhost:5050/api`
- **Database**: Proxmox MongoDB (`192.168.0.205:27017`)
- **Key Files**:
  - `.env`: API keys and DB credentials.
  - `server/server.js`: Loads `.env` from project root.
  - `client/vite.config.js`: `envDir: '../'`, `host: true`, proxy to `:5050`.

### Test Suite
```bash
npm --prefix server test
# 22 tests, 4 suites — all passing
```

---

## 📋 Next Steps
1. **Delete Confirmation UX**: "Impact Preview" (e.g., "Deleting this song will archive 3 audits") in delete modals — backend `getDeletePreview()` already exists.
2. **Custom Research Sources**: Allow users to manually add source URLs to a song's research data from `AuditDetail`. Backend endpoint stub needed.
3. **Mobile Optimization**: Refine the AudioPlayer tape deck and 5-step Guided Workflow for tablet/mobile viewports.
4. **Audit Search/Filter**: Dashboard currently filters songs; adding audit-level search (by lens, date, status) would help as the library grows.

---

## 🔗 Critical Docs
- [devlogs.md](./devlogs.md) — Session-by-session development learnings and architectural decisions.
- [PROXMOX_DEPLOYMENT.md](./PROXMOX_DEPLOYMENT.md) — Manual deployment guide for Proxmox LXC.
- [SETUP.md](./SETUP.md) — Local development environment setup.

**Core workflow, settings preferences, and technique practice room workspace are fully functional and complete.** 🎵

