// Demo mock data — used when Supabase is not connected
// Multi-tenant v4: all data scoped to demo organization

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

export const DEMO_ORGANIZATIONS = [
  { id: DEMO_ORG_ID, name: 'โรงเรียนสาธิตสามัคคีวิทยา', slug: 'demo-school', type: 'school', subscription_tier: 'enterprise', subscription_status: 'active', max_users: 50, settings: { year_label_type: 'fiscal_year' } },
]

export const DEMO_ORGANIZATION_MEMBERS = [
  { id: 'mem-1', organization_id: DEMO_ORG_ID, profile_id: 'demo-1', role: 'owner' },
  { id: 'mem-2', organization_id: DEMO_ORG_ID, profile_id: 'demo-2', role: 'manager' },
  { id: 'mem-3', organization_id: DEMO_ORG_ID, profile_id: 'demo-3', role: 'member' },
]

export const DEMO_FISCAL_YEARS = [
  { id: 'fy-1', organization_id: DEMO_ORG_ID, name: '2568', start_date: '2024-10-01', end_date: '2025-09-30', is_active: true },
  { id: 'fy-2', organization_id: DEMO_ORG_ID, name: '2567', start_date: '2023-10-01', end_date: '2024-09-30', is_active: false },
]

export const DEMO_CATEGORIES = [
  { id: 'cat-1', organization_id: DEMO_ORG_ID, category_key: 'ACTIVITY_FUNDS', category_name: 'เงินกิจกรรมพัฒนาผู้เรียน', description: 'กิจกรรมนักเรียน', is_active: true },
  { id: 'cat-2', organization_id: DEMO_ORG_ID, category_key: 'SUPPLIES_FUNDS', category_name: 'เงินค่าอุปกรณ์การเรียน', description: 'อุปกรณ์การเรียนการสอน', is_active: true },
  { id: 'cat-3', organization_id: DEMO_ORG_ID, category_key: 'INCOME', category_name: 'เงินรายได้สถานศึกษา', description: 'รายได้สถานศึกษา', is_active: true },
  { id: 'cat-4', organization_id: DEMO_ORG_ID, category_key: 'LUNCH', category_name: 'เงินอาหารกลางวัน', description: 'อาหารกลางวัน', is_active: true },
  { id: 'cat-5', organization_id: DEMO_ORG_ID, category_key: 'SUBSIDY', category_name: 'เงินอุดหนุนรายหัว', description: 'เงินอุดหนุน', is_active: true },
  { id: 'cat-6', organization_id: DEMO_ORG_ID, category_key: 'DONATION', category_name: 'เงินบริจาค', description: 'เงินบริจาค', is_active: true },
]

export const DEMO_WORK_GROUPS = [
  { id: 'wg-1', organization_id: DEMO_ORG_ID, name: 'วิชาการ', color: 'bg-blue-100 text-blue-700', is_active: true, sort_order: 1 },
  { id: 'wg-2', organization_id: DEMO_ORG_ID, name: 'งบประมาณ', color: 'bg-purple-100 text-purple-700', is_active: true, sort_order: 2 },
  { id: 'wg-3', organization_id: DEMO_ORG_ID, name: 'บุคคล', color: 'bg-orange-100 text-orange-700', is_active: true, sort_order: 3 },
  { id: 'wg-4', organization_id: DEMO_ORG_ID, name: 'ทั่วไป', color: 'bg-emerald-100 text-emerald-700', is_active: true, sort_order: 4 },
  { id: 'wg-5', organization_id: DEMO_ORG_ID, name: 'อื่นๆ', color: 'bg-gray-100 text-gray-600', is_active: true, sort_order: 5 },
]

export const DEMO_PROJECTS = [
  { id: 'proj-1', organization_id: DEMO_ORG_ID, fiscal_year_id: 'fy-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ', budget: 150000, work_group: 'วิชาการ', responsible_person: 'นางสมศรี ใจดี', description: 'จัดอบรมภาษาอังกฤษสำหรับนักเรียนระดับชั้น ม.1-ม.6 ตลอดปีการศึกษา', start_date: '2024-10-01', end_date: '2025-09-30', status: 'active', used_budget: 85000, created_by: 'demo-1', fiscal_years: { id: 'fy-1', name: '2568' }, txCount: 3, pct: 56.7, used: 85000, remaining: 65000, profiles: { display_name: 'ผู้ดูแลระบบ' } },
  { id: 'proj-2', organization_id: DEMO_ORG_ID, fiscal_year_id: 'fy-1', name: 'ปรับปรุงห้องปฏิบัติการคอมพิวเตอร์', budget: 500000, work_group: 'งบประมาณ', responsible_person: 'นายสมชาย รักเรียน', description: 'จัดซื้อคอมพิวเตอร์ใหม่ 40 เครื่องพร้อมอุปกรณ์เครือข่าย', start_date: '2024-11-01', end_date: '2025-03-31', status: 'active', used_budget: 420000, created_by: 'demo-1', fiscal_years: { id: 'fy-1', name: '2568' }, txCount: 5, pct: 84, used: 420000, remaining: 80000, profiles: { display_name: 'ผู้ดูแลระบบ' } },
  { id: 'proj-3', organization_id: DEMO_ORG_ID, fiscal_year_id: 'fy-1', name: 'พัฒนาหลักสูตรท้องถิ่น', budget: 80000, work_group: 'ทั่วไป', responsible_person: 'นายประภาส รู้รอบ', description: 'พัฒนาหลักสูตรวิชาชีพท้องถิ่นสำหรับนักเรียน', start_date: '2024-12-01', end_date: '2025-08-31', status: 'active', used_budget: 78000, created_by: 'demo-1', fiscal_years: { id: 'fy-1', name: '2568' }, txCount: 4, pct: 97.5, used: 78000, remaining: 2000, profiles: { display_name: 'ผู้ดูแลระบบ' } },
  { id: 'proj-4', organization_id: DEMO_ORG_ID, fiscal_year_id: 'fy-2', name: 'โครงการอาหารกลางวัน ปี 2567', budget: 200000, work_group: 'บุคคล', responsible_person: 'นางวิภา แสนดี', description: 'โครงการอาหารกลางวันประจำปีงบประมาณ 2567', start_date: '2023-10-01', end_date: '2024-09-30', status: 'completed', used_budget: 200000, created_by: 'demo-1', fiscal_years: { id: 'fy-2', name: '2567' }, txCount: 12, pct: 100, used: 200000, remaining: 0, profiles: { display_name: 'ผู้ดูแลระบบ' } },
  { id: 'proj-5', organization_id: DEMO_ORG_ID, fiscal_year_id: 'fy-1', name: 'ซ่อมแซมอาคารเรียน', budget: 300000, work_group: 'อื่นๆ', responsible_person: 'นายธนา ช่างคิด', description: 'ซ่อมหลังคาและทาสีอาคารเรียนทั้งหลัง', start_date: '2025-01-01', end_date: '2025-06-30', status: 'suspended', used_budget: 0, created_by: 'demo-1', fiscal_years: { id: 'fy-1', name: '2568' }, txCount: 0, pct: 0, used: 0, remaining: 300000, profiles: { display_name: 'ผู้ดูแลระบบ' } },
]

export const DEMO_TRANSACTIONS = [
  { id: 'tx-1', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-1', amount: -15000, transaction_type: 'expense', description: 'ค่าอาหารว่างและเครื่องดื่มอบรม', transaction_date: '2024-11-15', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' }, profiles: { display_name: 'นางสมศรี ใจดี' }, created_at: '2024-11-15T10:00:00Z' },
  { id: 'tx-2', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-2', amount: -30000, transaction_type: 'expense', description: 'ซื้อหนังสือแบบเรียนภาษาอังกฤษ', transaction_date: '2024-11-20', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินค่าอุปกรณ์การเรียน' }, profiles: { display_name: 'นางสมศรี ใจดี' }, created_at: '2024-11-20T14:00:00Z' },
  { id: 'tx-3', organization_id: DEMO_ORG_ID, project_id: 'proj-2', category_type_id: 'cat-2', amount: -420000, transaction_type: 'expense', description: 'จัดซื้อคอมพิวเตอร์ Dell 40 เครื่อง', transaction_date: '2024-12-01', projects: { id: 'proj-2', name: 'ปรับปรุงห้องปฏิบัติการคอมพิวเตอร์' }, category_types: { category_name: 'เงินค่าอุปกรณ์การเรียน' }, profiles: { display_name: 'นายสมชาย รักเรียน' }, created_at: '2024-12-01T09:00:00Z' },
  { id: 'tx-4', organization_id: DEMO_ORG_ID, project_id: 'proj-3', category_type_id: 'cat-1', amount: -78000, transaction_type: 'expense', description: 'จัดทำเอกสารหลักสูตรท้องถิ่น', transaction_date: '2025-02-01', projects: { id: 'proj-3', name: 'พัฒนาหลักสูตรท้องถิ่น' }, category_types: { category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' }, profiles: { display_name: 'นายประภาส รู้รอบ' }, created_at: '2025-02-01T11:00:00Z' },
  { id: 'tx-5', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-3', amount: 50000, transaction_type: 'income', description: 'เงินสนับสนุนจาก สพฐ.', transaction_date: '2024-10-15', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินรายได้สถานศึกษา' }, profiles: { display_name: 'ผู้ดูแลระบบ' }, created_at: '2024-10-15T08:00:00Z' },
  { id: 'tx-6', organization_id: DEMO_ORG_ID, project_id: 'proj-2', category_type_id: 'cat-1', amount: 100000, transaction_type: 'income', description: 'เงินสนับสนุนจากอบจ.', transaction_date: '2024-11-01', projects: { id: 'proj-2', name: 'ปรับปรุงห้องปฏิบัติการคอมพิวเตอร์' }, category_types: { category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' }, profiles: { display_name: 'ผู้ดูแลระบบ' }, created_at: '2024-11-01T10:00:00Z' },
  { id: 'tx-7', organization_id: DEMO_ORG_ID, project_id: 'proj-3', category_type_id: 'cat-5', amount: -5000, transaction_type: 'expense', description: 'ค่าถ่ายเอกสาร', transaction_date: '2025-01-15', projects: { id: 'proj-3', name: 'พัฒนาหลักสูตรท้องถิ่น' }, category_types: { category_name: 'เงินอุดหนุนรายหัว' }, profiles: { display_name: 'นายประภาส รู้รอบ' }, created_at: '2025-01-15T13:00:00Z' },
  { id: 'tx-8', organization_id: DEMO_ORG_ID, project_id: 'proj-4', category_type_id: 'cat-4', amount: -200000, transaction_type: 'expense', description: 'ค่าอาหารกลางวันทั้งปี', transaction_date: '2023-10-01', projects: { id: 'proj-4', name: 'โครงการอาหารกลางวัน ปี 2567' }, category_types: { category_name: 'เงินอาหารกลางวัน' }, profiles: { display_name: 'นางวิภา แสนดี' }, created_at: '2023-10-01T08:00:00Z' },
  { id: 'tx-9', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-6', amount: -40000, transaction_type: 'expense', description: 'ซื้ออุปกรณ์การเรียนเพิ่มเติม', transaction_date: '2025-01-10', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินบริจาค' }, profiles: { display_name: 'นางสมศรี ใจดี' }, created_at: '2025-01-10T15:00:00Z' },
]

export const DEMO_BUDGET_CATEGORIES = [
  { id: 'bc-1', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-1', budget_amount: 50000, category_types: { category_key: 'ACTIVITY_FUNDS' } },
  { id: 'bc-2', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-2', budget_amount: 60000, category_types: { category_key: 'SUPPLIES_FUNDS' } },
  { id: 'bc-3', organization_id: DEMO_ORG_ID, project_id: 'proj-1', category_type_id: 'cat-3', budget_amount: 40000, category_types: { category_key: 'INCOME' } },
  { id: 'bc-4', organization_id: DEMO_ORG_ID, project_id: 'proj-2', category_type_id: 'cat-2', budget_amount: 500000, category_types: { category_key: 'SUPPLIES_FUNDS' } },
]

export const DEMO_SETTINGS = [
  { setting_key: 'site_name', setting_value: 'ระบบควบคุมงบประมาณ', organization_id: DEMO_ORG_ID },
  { setting_key: 'organization_name', setting_value: 'โรงเรียนสาธิตสามัคคีวิทยา', organization_id: DEMO_ORG_ID },
  { setting_key: 'site_title', setting_value: 'ระบบควบคุมงบประมาณ - โรงเรียนสาธิตสามัคคีวิทยา', organization_id: DEMO_ORG_ID },
  { setting_key: 'year_label_type', setting_value: 'fiscal_year', organization_id: DEMO_ORG_ID },
  { setting_key: 'enable_pwa', setting_value: 'true', organization_id: DEMO_ORG_ID },
]

export const DEMO_PROFILES = [
  { id: 'demo-1', email: 'admin@demo.school', display_name: 'ผู้ดูแลระบบ', role: 'admin', approved: true, active_organization_id: DEMO_ORG_ID, department: 'IT', position: 'Admin', created_at: '2025-01-01' },
  { id: 'demo-2', email: 'somsri@demo.school', display_name: 'นางสมศรี ใจดี', role: 'manager', approved: true, active_organization_id: DEMO_ORG_ID, department: 'วิชาการ', position: 'ครูชำนาญการ', created_at: '2025-02-01' },
  { id: 'demo-3', email: 'somchai@demo.school', display_name: 'นายสมชาย รักเรียน', role: 'user', approved: true, active_organization_id: DEMO_ORG_ID, department: 'เทคโนโลยี', position: 'ครู', created_at: '2025-03-01' },
  { id: 'demo-4', email: 'newuser@demo.school', display_name: 'นายสมหมาย ทดสอบ', role: 'pending', approved: false, active_organization_id: DEMO_ORG_ID, department: 'ทั่วไป', position: 'ครูผู้ช่วย', created_at: '2025-06-01' },
]

export { DEMO_ORG_ID }
