-- Budget Control SaaS v4 — Multi-Tenant Supabase Schema
-- Each school is an "organization" — all data isolated by organization_id

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═════════════════════════════════════
-- ORGANIZATIONS (schools/tenants)
-- ═════════════════════════════════════
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    type TEXT DEFAULT 'school' CHECK (type IN ('school', 'university', 'office', 'other')),
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    max_users INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a default demo organization
INSERT INTO public.organizations (id, name, slug, type, settings, subscription_tier, max_users)
VALUES ('00000000-0000-0000-0000-000000000001', 'โรงเรียนซับใหญ่วิทยาคม', 'sapyai', 'school',
        '{"year_label_type": "fiscal_year", "currency": "THB"}', 'free', 999999)
ON CONFLICT DO NOTHING;

-- ═════════════════════════════════════
-- ORGANIZATION MEMBERS (users in schools)
-- ═════════════════════════════════════
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- ═════════════════════════════════════
-- PROFILES (extends Supabase auth.users)
-- ═════════════════════════════════════
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('admin', 'manager', 'user', 'pending')),
    approved BOOLEAN DEFAULT false,
    department TEXT,
    position TEXT,
    -- Multi-tenant: user's active/default organization
    active_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════
-- FISCAL YEARS (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ═════════════════════════════════════
-- CATEGORY TYPES (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.category_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_key TEXT NOT NULL,
    category_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, category_key)
);

-- ═════════════════════════════════════
-- WORK GROUPS (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.work_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'bg-gray-100 text-gray-600',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- ═════════════════════════════════════
-- PROJECTS (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    fiscal_year_id UUID REFERENCES public.fiscal_years(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    budget DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    work_group TEXT,
    responsible_person TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
    used_budget DECIMAL(15,2) DEFAULT 0.00,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════
-- BUDGET CATEGORIES (per project)
-- ═════════════════════════════════════
CREATE TABLE public.budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category_type_id UUID NOT NULL REFERENCES public.category_types(id) ON DELETE CASCADE,
    budget_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, category_type_id)
);

-- ═════════════════════════════════════
-- TRANSACTIONS (per project → per org)
-- ═════════════════════════════════════
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category_type_id UUID REFERENCES public.category_types(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer_in', 'transfer_out')),
    description TEXT,
    transaction_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════
-- SYSTEM SETTINGS (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, setting_key)
);

-- ═════════════════════════════════════
-- ACTIVITY LOG (per organization)
-- ═════════════════════════════════════
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════
-- INVITATIONS (for member invites)
-- ═════════════════════════════════════
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════
CREATE INDEX idx_profiles_active_org ON public.profiles(active_organization_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON public.organization_members(profile_id);
CREATE INDEX idx_fiscal_years_org ON public.fiscal_years(organization_id);
CREATE INDEX idx_category_types_org ON public.category_types(organization_id);
CREATE INDEX idx_work_groups_org ON public.work_groups(organization_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_projects_fy ON public.projects(fiscal_year_id);
CREATE INDEX idx_budget_categories_org ON public.budget_categories(organization_id);
CREATE INDEX idx_transactions_org ON public.transactions(organization_id);
CREATE INDEX idx_transactions_project ON public.transactions(project_id);
CREATE INDEX idx_system_settings_org ON public.system_settings(organization_id);
CREATE INDEX idx_activity_log_org ON public.activity_log(organization_id);
CREATE INDEX idx_invitations_org ON public.invitations(organization_id);

-- ═════════════════════════════════════
-- HELPER: Get current user's organization_id
-- ═════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT active_organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═════════════════════════════════════
-- RLS POLICIES — All scoped to organization
-- ═════════════════════════════════════
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Organizations: members can read their own org
CREATE POLICY "Members can view their org" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid())
        OR id = (SELECT active_organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Organization members: members can see their own org's members
CREATE POLICY "View org members" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid())
    );

-- Profiles: users can see members in their org
CREATE POLICY "View profiles in same org" ON public.profiles
    FOR SELECT USING (
        id IN (SELECT profile_id FROM public.organization_members WHERE organization_id = public.get_user_org_id())
        OR id = auth.uid()
    );

-- Generic org-scoped policy for data tables
-- Each table: user must be a member of the organization that owns the row
CREATE POLICY "Org-scoped access" ON public.fiscal_years FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.category_types FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.work_groups FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.projects FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.budget_categories FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.transactions FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.system_settings FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org-scoped access" ON public.activity_log FOR ALL
    USING (organization_id = public.get_user_org_id())
    WITH CHECK (organization_id = public.get_user_org_id());

-- ═════════════════════════════════════
-- SEED DATA — Demo organization
-- ═════════════════════════════════════
DO $$ 
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Seed fiscal years
    INSERT INTO public.fiscal_years (id, organization_id, name, start_date, end_date, is_active)
    VALUES 
        ('10000000-0000-0000-0000-000000000001', demo_org_id, '2568', '2024-10-01', '2025-09-30', true),
        ('10000000-0000-0000-0000-000000000002', demo_org_id, '2567', '2023-10-01', '2024-09-30', false)
    ON CONFLICT DO NOTHING;

    -- Seed category types
    INSERT INTO public.category_types (id, organization_id, category_key, category_name, description)
    VALUES
        ('20000000-0000-0000-0000-000000000001', demo_org_id, 'ACTIVITY_FUNDS', 'เงินกิจกรรมพัฒนาผู้เรียน', 'กิจกรรมนักเรียน'),
        ('20000000-0000-0000-0000-000000000002', demo_org_id, 'SUPPLIES_FUNDS', 'เงินค่าอุปกรณ์การเรียน', 'อุปกรณ์การเรียนการสอน'),
        ('20000000-0000-0000-0000-000000000003', demo_org_id, 'INCOME', 'เงินรายได้สถานศึกษา', 'รายได้สถานศึกษา'),
        ('20000000-0000-0000-0000-000000000004', demo_org_id, 'LUNCH', 'เงินอาหารกลางวัน', 'อาหารกลางวัน'),
        ('20000000-0000-0000-0000-000000000005', demo_org_id, 'SUBSIDY', 'เงินอุดหนุนรายหัว', 'เงินอุดหนุน'),
        ('20000000-0000-0000-0000-000000000006', demo_org_id, 'DONATION', 'เงินบริจาค', 'เงินบริจาค')
    ON CONFLICT DO NOTHING;

    -- Seed work groups
    INSERT INTO public.work_groups (id, organization_id, name, color, sort_order)
    VALUES
        ('30000000-0000-0000-0000-000000000001', demo_org_id, 'วิชาการ', 'bg-blue-100 text-blue-700', 1),
        ('30000000-0000-0000-0000-000000000002', demo_org_id, 'งบประมาณ', 'bg-purple-100 text-purple-700', 2),
        ('30000000-0000-0000-0000-000000000003', demo_org_id, 'บุคคล', 'bg-orange-100 text-orange-700', 3),
        ('30000000-0000-0000-0000-000000000004', demo_org_id, 'ทั่วไป', 'bg-emerald-100 text-emerald-700', 4),
        ('30000000-0000-0000-0000-000000000005', demo_org_id, 'อื่นๆ', 'bg-gray-100 text-gray-600', 5)
    ON CONFLICT DO NOTHING;

    -- Seed system settings
    INSERT INTO public.system_settings (organization_id, setting_key, setting_value)
    VALUES
        (demo_org_id, 'site_name', 'ระบบควบคุมงบประมาณ'),
        (demo_org_id, 'organization_name', 'โรงเรียนซับใหญ่วิทยาคม'),
        (demo_org_id, 'site_title', 'ระบบควบคุมงบประมาณ - โรงเรียนซับใหญ่วิทยาคม'),
        (demo_org_id, 'year_label_type', 'fiscal_year'),
        (demo_org_id, 'enable_pwa', 'true')
    ON CONFLICT DO NOTHING;
END $$;
