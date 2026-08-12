# SkillSync Feature Audit & Backend Mapping

**Date:** 2026-08-10  
**Purpose:** Comprehensive audit of all frontend features and their backend endpoint connections

---

## 📊 Feature Overview

### ✅ FULLY CONNECTED Features (Backend Ready)

1. **Authentication System** (`LoginPage.jsx`, `SignupPage.jsx`)
   - ✅ User signup → `POST /api/auth/signup`
   - ✅ User login → `POST /api/auth/login`
   - ✅ Get current user → `GET /api/auth/me`
   - ✅ Admin check → `GET /api/auth/is_admin`
   - ✅ User check → `GET /api/auth/is_user`

2. **Resume Analysis** (`AnalyzePage.jsx`)
   - ✅ Upload & analyze resume → `POST /api/analyze`
   - ✅ Get AI feedback → `POST /api/analyze/feedback`
   - ✅ Analyze for specific role → `POST /api/analyze/role`
   - ✅ LinkedIn profile analysis → `POST /api/analyze/linkedin`

3. **Job Board** (`JobsPage.jsx`)
   - ✅ Get jobs with filters → `GET /api/jobs`
   - ✅ Trigger job scraping → `POST /api/jobs/refresh`
   - ✅ Get scraper status → `GET /api/jobs/status`

4. **Settings Page** (`SettingsPage.jsx`)
   - ✅ Set API key → `POST /api/settings/api-key`
   - ✅ Get API key status → `GET /api/settings/api-key/status`

5. **User Profile** (`ProfilePage.jsx`)
   - ✅ Get user profile → `GET /api/user_profile`
   - ✅ Update personal info → `POST /api/user_profile/personalInfo/update`
   - ✅ Update skill set → `POST /api/user_profile/skill_set/update`

6. **Roles/Skills**
   - ✅ Get all roles → `GET /api/roles`

---

## ⚠️ PARTIALLY CONNECTED / MOCK DATA Features

### 1. **Admin Panel** (`AdminPage.jsx`)

**Current State:** Uses hardcoded mock data for all operations

**Missing Backend Endpoints:**

#### Users Management
- ❌ `GET /api/admin/users` - Get all users with stats
- ❌ `GET /api/admin/users/{user_id}` - Get detailed user info
- ❌ `PATCH /api/admin/users/{user_id}/role` - Toggle user role
- ❌ `DELETE /api/admin/users/{user_id}` - Delete/suspend user

#### Jobs Management
- ❌ `POST /api/admin/jobs` - Add job manually
- ❌ `PUT /api/admin/jobs/{job_id}` - Edit job listing
- ❌ `DELETE /api/admin/jobs/{job_id}` - Delete job listing

#### Scraper Logs
- ❌ `GET /api/admin/scraper/logs` - Get scraper run history
- ❌ `POST /api/admin/scraper/trigger` - Manual scraper trigger with platform selection
- ❌ `PUT /api/admin/scraper/config` - Update cron config

#### System Stats
- ❌ `GET /api/admin/stats` - Dashboard overview stats

**Frontend Features:**
- Dashboard overview with KPIs
- Scraper panel with manual trigger
- Job listings CRUD operations
- User management with role toggle
- System configuration (API keys, models, cron)

---

### 2. **Dashboard/Tracker Page** (`DashboardPage.jsx`)

**Current State:** Uses localStorage for score history, client-side resume comparison

**Missing Backend Endpoints:**

- ❌ `GET /api/user/history` - Get user's analysis history
- ❌ `POST /api/user/history` - Save analysis result to history
- ❌ `POST /api/analyze/compare` - Server-side resume comparison

**Frontend Features:**
- Score growth chart (historical tracking)
- Achievements & badges
- Side-by-side resume comparison
- Streak tracking

---

### 3. **Job Tracker** (`TrackerPage.jsx`)

**Current State:** Uses localStorage for application tracking, no backend persistence

**Missing Backend Endpoints:**

- ❌ `GET /api/user/applications` - Get user's tracked applications
- ❌ `POST /api/user/applications` - Add application to tracker
- ❌ `PATCH /api/user/applications/{app_id}` - Update application status
- ❌ `DELETE /api/user/applications/{app_id}` - Remove tracked application

**Frontend Features:**
- Kanban board (Wishlist → Applied → Interview → Offered → Archive)
- Drag-and-drop status updates
- Manual application entry form
- Application metadata (company, salary, location, etc.)

---

### 4. **Profile Page - Saved Jobs** (`ProfilePage.jsx`)

**Current State:** Empty array, no backend connection

**Missing Backend Endpoints:**

- ❌ `GET /api/user/saved-jobs` - Get user's saved/bookmarked jobs
- ❌ `POST /api/user/saved-jobs` - Save a job
- ❌ `DELETE /api/user/saved-jobs/{job_id}` - Remove saved job

**Frontend Features:**
- Saved jobs list with quick apply
- Remove from saved

---

### 5. **Homepage** (`HomePage.jsx`)

**Status:** Needs review (not examined in detail yet)

---

## 🔧 Backend Endpoints That Need Creation

### Priority 1: Core User Features

1. **User History & Progress Tracking**
   ```python
   GET  /api/user/history              # Analysis history
   POST /api/user/history              # Save analysis
   GET  /api/user/stats                # User statistics
   ```

2. **Job Tracking (Kanban Board)**
   ```python
   GET    /api/user/applications       # All tracked applications
   POST   /api/user/applications       # Add new application
   PATCH  /api/user/applications/{id}  # Update status/details
   DELETE /api/user/applications/{id}  # Remove application
   ```

3. **Saved Jobs**
   ```python
   GET    /api/user/saved-jobs         # User's saved jobs
   POST   /api/user/saved-jobs         # Save a job
   DELETE /api/user/saved-jobs/{id}    # Unsave job
   ```

### Priority 2: Admin Panel

4. **Admin - Users Management**
   ```python
   GET    /api/admin/users             # All users with filters
   GET    /api/admin/users/{id}        # User details
   PATCH  /api/admin/users/{id}/role   # Toggle user role
   DELETE /api/admin/users/{id}        # Delete user
   GET    /api/admin/stats             # Dashboard stats
   ```

5. **Admin - Jobs Management**
   ```python
   POST   /api/admin/jobs              # Create job manually
   PUT    /api/admin/jobs/{id}         # Update job
   DELETE /api/admin/jobs/{id}         # Delete job
   ```

6. **Admin - Scraper Management**
   ```python
   GET  /api/admin/scraper/logs        # Scraper history
   POST /api/admin/scraper/trigger     # Trigger with platform
   GET  /api/admin/scraper/config      # Get config
   PUT  /api/admin/scraper/config      # Update cron/platforms
   ```

### Priority 3: Enhanced Features

7. **Resume Comparison**
   ```python
   POST /api/analyze/compare           # Compare two resumes
   ```

---

## 📋 Database Schema Additions Needed

### New Tables Required:

1. **`AnalysisHistory`**
   ```python
   - id: Integer (PK)
   - user_id: Integer (FK → users.id)
   - date: DateTime
   - role: String
   - score: Float
   - matched_skills: JSON
   - missing_skills: JSON
   - resume_filename: String
   ```

2. **`JobApplications`** (Tracker/Kanban)
   ```python
   - id: Integer (PK)
   - user_id: Integer (FK → users.id)
   - title: String
   - company: String
   - location: String
   - salary: String
   - link: String
   - platform: String
   - status: Enum (wishlist, applied, interviewing, offered, rejected)
   - date_added: DateTime
   - date_updated: DateTime
   ```

3. **`SavedJobs`**
   ```python
   - id: Integer (PK)
   - user_id: Integer (FK → users.id)
   - job_id: Integer (FK → jobs.id)
   - saved_at: DateTime
   ```

---

## 🎯 Implementation Strategy

### Phase 1: Database Models (Priority 1)
1. Create new models in `backend/app/models.py`
2. Add corresponding Pydantic schemas in `backend/app/schema.py`
3. Create database migrations

### Phase 2: User-Facing Endpoints (Priority 1)
1. Create `backend/app/routes/user.py` for user-specific features
2. Implement history, applications, saved jobs endpoints
3. Update frontend `api/client.js` with new functions
4. Connect TrackerPage to backend
5. Connect DashboardPage history to backend
6. Connect ProfilePage saved jobs to backend

### Phase 3: Admin Panel (Priority 2)
1. Create `backend/app/routes/admin.py` for admin-only routes
2. Implement admin middleware/decorator for auth
3. Implement user management endpoints
4. Implement job management endpoints
5. Implement scraper management endpoints
6. Connect AdminPage to real backend

### Phase 4: Refactoring (Priority 3)
1. Extract common patterns into utility functions
2. Simplify complex components
3. Remove code duplication
4. Add comprehensive error handling
5. Add input validation

### Phase 5: Documentation
1. Update README with all new endpoints
2. Add API documentation
3. Update setup instructions

---

## 📝 Code Quality Improvements Needed

### KISS Principle Violations
- AdminPage.jsx has 900+ lines with complex state management
- Multiple nested ternary operators in UI rendering
- Inline mock data generation (should be in separate utility)

### DRY Principle Violations
- Job card rendering duplicated across components
- User profile fetching logic repeated
- Form validation patterns repeated
- API error handling repeated in every component

### Refactoring Opportunities
1. Extract common UI components: `<StatCard>`, `<KPICard>`, `<AdminTable>`
2. Create custom hooks: `useAnalysisHistory`, `useJobTracker`, `useSavedJobs`
3. Centralize form validation logic
4. Create unified error handling utility
5. Extract color/theme utilities

---

## ✅ Next Steps

1. ✅ Complete this audit document
2. ⏳ Create database models for new tables
3. ⏳ Implement user-facing endpoints
4. ⏳ Connect frontend to new endpoints
5. ⏳ Implement admin endpoints
6. ⏳ Refactor codebase for KISS/DRY
7. ⏳ Update documentation
8. ⏳ Test all connections

---

**End of Audit**
