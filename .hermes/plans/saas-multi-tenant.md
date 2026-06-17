# SaaS Multi-Tenant — Implementation Plan

> **สำหรับ Hermes:** ใช้ plan นี้เป็นแนวทาง แบ่ง Phase สร้างทีละขั้น

**Goal:** เปลี่ยน budget-control จาก single-school → SaaS ให้โรงเรียนหลายแห่งสมัครใช้งาน แยกข้อมูลอิสระต่อกัน

**Architecture:** Multi-tenant ด้วย `organization_id` — ทุกตารางมี FK ไป organizations, RLS scoped, URL path-based ด้วย cookie context

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS), shadcn/ui, TypeScript

---

## Phase 1: Database Schema — Multi-Tenant Foundation

### Task 1.1: Create `organizations` table
- ✅ id, name, slug (unique), logo_url, settings (JSONB), subscription_tier, subscription_status, max_users, created_at
- Seed default organization from existing data

### Task 1.2: Create `organization_members` table  
- ✅ organization_id → FK, profile_id → FK, role (owner/admin/member), joined_at

### Task 1.3: Add `organization_id` FK to all existing tables
- ✅ projects, transactions, fiscal_years, category_types, work_groups, system_settings, activity_log
- ✅ Migrate existing data to default org

### Task 1.4: Add RLS policies (organization-scoped)
- ✅ All tables: users can only see/CRUD rows where organization_id = their org

---

## Phase 2: Auth + Organization Context

### Task 2.1: Registration page with org creation
- ✅ Sign up form → create Supabase auth → create profile → create organization → auto-join as owner

### Task 2.2: Organization context (middleware/cookie)
- ✅ Set `x-organization-id` cookie, read in server components/actions
- ✅ All DB queries filter by org

### Task 2.3: Organization switcher
- ✅ Dropdown in sidebar/topbar for multi-org users

### Task 2.4: Invite system
- ✅ Owner/admin invite by email → creates profile → adds to organization_members

---

## Phase 3: UI & Onboarding

### Task 3.1: Onboarding wizard
- ✅ Step 1: School name, slug, type
- ✅ Step 2: Fiscal year setup
- ✅ Step 3: Seed categories + work groups

### Task 3.2: Update all pages with org context
- ✅ Sidebar shows org name
- ✅ Settings per-organization
- ✅ URL paths stay clean (/dashboard, /projects)

### Task 3.3: Super Admin portal
- ✅ `/admin` — list all organizations, stats, manage subscriptions

---

## Phase 4: Polish & Deploy

### Task 4.1: Landing page
- ✅ Marketing page `/` with features, pricing, sign up CTA

### Task 4.2: Subscription tiers (free/pro)
- ✅ Limit users/projects/transactions per tier
- ✅ Stripe integration (future)

---

**Implementation order:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Status:** 🟢 Phase 1 เริ่มแล้ว
