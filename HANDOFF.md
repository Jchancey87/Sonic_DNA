# Hand-off Document: Sonic DNA — UI/UX Hardening & Profile Updates

## Project Status: **System Hardening & Profile Mutations Completed** ✅
**Current State**: All core workflow issues, UI/UX critiques, and user profile operations have been successfully implemented and verified. The application supports end-to-end Title Case typography, sidebar highlights for subpaths, a collapsible and responsive global audio footer, simulated signal extraction visual feedback, collapsible trash, bulk empty trash features, and complete user security mutations (profile name editing, password changes, and account deletion).

---

## 🏗️ Technical Architecture
The system uses **Hexagonal Architecture (Ports & Adapters)** to isolate business logic from external dependencies.

- **Frontend (React)**: Uses `useBackend()` hook to interact with an abstract `IBackendService`. `HttpBackendAdapter` handles all live API calls.
- **Backend (Node/Express)**:
  - **Adapters**: `OpenAIAdapter` (supports OpenRouter), `TavilyAdapter` (Bearer auth, 6-source cap), `MongooseRepository`.
  - **Services**: `SongService`, `AuditService`, `TechniqueService`, `TemplateComposer` — all fully decoupled and unit-tested.
- **Database**: Proxmox MongoDB (`192.168.0.205:27017`).

---

## 💎 Key Features Delivered

### 1. **UI/UX & Typography Overhaul**
- **ALL CAPS Overload Removed**: Eliminated forced uppercase rules in `global.js` for headings, card titles, buttons, and labels. Converted components to clean Title/Sentence Case.
- **Micro-interactions**: Added smooth hover scaling on song cards (`.song-card-thumbnail`) to provide premium depth.
- **Sidebar Highlighting**: The Navigator sidebar now highlights active page states (including subpaths of `/audit/...` for the Library tab) with a prominent left accent border (`borderLeft: '3px solid #d08f60'`). Removed emojis from navigation labels.

### 2. **Dynamic Audio Transport Footer**
- **Conditional Visibility**: The tape deck footer is hidden completely when no active track is loaded.
- **Floating Monitor Coordinates Sync**: The tape deck's minimize/expand states are stored in the global `AudioContext` to automatically shift the floating YouTube monitor bottom alignment, maintaining layout consistency.
- **Tooltip Explanations**: Added guidance tooltips to bookmark creators indicating that a song audit must be active.

### 3. **Simulated Signal Extraction Sequence**
- **Live Progress Steps**: During song imports, a simulated live progress tracker steps through metadata extraction, production research, and GPT template synthesis dynamically.

### 4. **Practice Room Kanban Board Updates**
- **Compact Technique Cards**: Passes `compact={true}` to `TechniqueCard` in Kanban lanes to hide notes textareas and tag lists.
- **Guide Banner**: Added an instructions header explaining actions and categories at the top.

### 5. **Collapsible Archives & Bulk Purge**
- **Collapsible Accordions**: Replaced the tab layout in `Trash.jsx` with collapsible "Deleted Songs" and "Deleted Audits" accordions.
- **Empty Trash Trigger**: Added a bulk-delete action to purge all archived songs, audits, and technique notes in a single step.
- **Duration Fallback**: Formats invalid or zero durations as `"--:--"`.
- **Dark Theme modal**: Styled confirmation modals to match the dark aesthetic.

### 6. **Profile Mutations & Settings**
- **Editable display name**: Replaced static name label with an editable input field.
- **Security Actions**: Implemented Change Password and Delete Account modals in Settings.
- **Timezone search**: Enabled instant timezone filtering via a query text field.

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
1. **Custom Research Sources**: Allow users to manually add source URLs to a song's research data from `AuditDetail`. Backend endpoint stub needed.
2. **Mobile Optimization**: Refine the AudioPlayer tape deck and 5-step Guided Workflow for tablet/mobile viewports.
3. **Audit Search/Filter**: Add audit-level search (by lens, date, status) on the main Library tab as the database grows.

---

## 🔗 Critical Docs
- [devlogs.md](./devlogs.md) — Session-by-session development learnings and architectural decisions.
- [PROXMOX_DEPLOYMENT.md](./PROXMOX_DEPLOYMENT.md) — Manual deployment guide for Proxmox LXC.
- [SETUP.md](./SETUP.md) — Local development environment setup.
- [REDEPLOYMENT.md](./REDEPLOYMENT.md) — Commands to push changes to Git and redeploy to the Proxmox LXC.


